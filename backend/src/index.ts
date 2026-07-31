import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import db from './db';
import config, { reloadConfig, saveConfig } from './config';
import { ScanStatus, TaskQueueState, AppConfig } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 (用于图片资源)
app.use('/assets', express.static(path.join(__dirname, '../../public')));

// 托管前端构建后的静态文件
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// 任务队列状态 (简化版,实际应从 taskQueue 模块导入)
const getTaskQueueState = (): TaskQueueState => ({
  runningTask: null,
  pending: [],
  history: [],
  tasks: [],
  stats: { running: 0, pending: 0, completed: 0, failed: 0, cancelled: 0 }
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('控制台已连接');
  
  // 实时推送数据库内容
  const syncData = () => {
    const items = db.prepare(`
      SELECT i.id, i.name_zh, i.count,
             GROUP_CONCAT(il.chest_x || ',' || il.chest_y || ',' || il.chest_z || ':' || il.count) as locations
      FROM inventory i
      LEFT JOIN item_locations il ON i.id = il.item_id
      GROUP BY i.id
      ORDER BY i.count DESC, i.id ASC
    `).all();
    
    const status = db.prepare("SELECT * FROM scan_status WHERE id = 'global'").get() as ScanStatus;
    socket.emit('sync', { 
      items, 
      status, 
      taskQueue: getTaskQueueState() 
    });
  };

  const timer = setInterval(syncData, 1000);

  // 扫描指令处理
  socket.on('command_scan', (mode) => {
    console.log('[系统] 收到扫描指令:', mode);
    // TODO: 调用扫描模块
  });

  socket.on('command_force_rescan', () => {
    console.log('[系统] 收到强制重扫指令');
    db.prepare("DELETE FROM inventory").run();
    db.prepare("DELETE FROM item_locations").run();
    db.prepare("DELETE FROM container_items").run();
    // TODO: 启动扫描任务
  });

  socket.on('command_stop_scan', () => {
    console.log('[系统] 收到停止扫描指令');
    // TODO: 调用扫描模块停止方法
  });

  socket.on('command_set_scan_speed', (speed: number) => {
    if (Number.isNaN(speed) || speed < 1 || speed > 1000) {
      socket.emit('scan_speed_response', { 
        success: false, 
        error: '扫描速度必须在 1 到 1000 ms 之间' 
      });
      return;
    }
    db.prepare("UPDATE scan_status SET scan_speed = ? WHERE id = 'global'").run(speed);
    socket.emit('scan_speed_response', { success: true, scan_speed: speed });
  });

  socket.on('disconnect', () => clearInterval(timer));
});

// API 路由
// 获取物品的容器位置
app.get('/api/container-locations/:itemId', (req, res) => {
  try {
    const itemId = req.params.itemId;
    const fullItemId = itemId.startsWith('minecraft:') ? itemId : `minecraft:${itemId}`;
    
    const containers = db.prepare(`
      SELECT container_x, container_y, container_z, item_name_zh, count
      FROM container_items
      WHERE item_id = ?
      ORDER BY container_y DESC, container_z ASC, container_x ASC
    `).all(fullItemId);
    
    res.json({ success: true, containers });
  } catch (error: any) {
    console.error('[API错误]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取容器地图
app.get('/api/container-map', (req, res) => {
  try {
    const containers = db.prepare(`
      SELECT container_x, container_y, container_z, item_id, item_name_zh, count
      FROM container_items
      ORDER BY container_y DESC, container_z ASC, container_x ASC
    `).all();
    res.json({ success: true, containers });
  } catch (error: any) {
    console.error('[API错误]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Litematica 文件上传配置
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.litematic') {
      cb(null, true);
    } else {
      cb(new Error('只支持 .litematic 文件'));
    }
  }
});

// Litematica 文件分析端点
app.post('/api/litematica', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未选择文件' });
    }

    console.log('[Litematica] 开始解析文件:', req.file.originalname);
    
    // TODO: 调用 Litematica 解析模块
    res.json({ 
      success: false, 
      error: 'Litematica 解析模块尚未迁移完成' 
    });
  } catch (error: any) {
    console.error('[Litematica] 解析失败:', error);
    res.status(500).json({ error: '文件解析失败: ' + error.message });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 配置管理端点
// 获取当前配置
app.get('/api/config', (req, res) => {
  try {
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('[API错误]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新配置
app.put('/api/config', (req, res) => {
  try {
    const newConfig = req.body as AppConfig;

    // 验证必要的配置字段
    if (!newConfig.host || !newConfig.username || !newConfig.version) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的配置字段（host, username, version）'
      });
    }

    // 保存配置
    saveConfig(newConfig);

    // 重新加载配置
    const updatedConfig = reloadConfig();

    res.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('[API错误]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 前端路由兜底（所有非API请求返回index.html）
// 使用中间件处理所有未被其他路由匹配的请求
app.use((req, res, next) => {
  // 如果是API请求但没有匹配到路由，返回404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'API路由未找到'
    });
  }
  // 其他请求返回前端页面
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 启动服务器
const WEB_PORT = Number(process.env.WEB_PORT) || 3000;

server.on('error', (err: any) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`[Web] 端口 ${WEB_PORT} 已被占用`);
    return;
  }
  console.error('[Web] 启动失败:', err.message);
});

server.listen(WEB_PORT, () => {
  console.log(`服务已启动: http://localhost:${WEB_PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[系统] 收到 SIGTERM 信号,正在关闭服务器...');
  server.close(() => {
    console.log('[系统] 服务器已关闭');
    process.exit(0);
  });
});