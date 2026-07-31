import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import db from './db';
import config from './config';
import { ScanStatus, TaskQueueState } from './types';

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
  console.log(`后端服务已启动: http://localhost:${WEB_PORT}`);
  console.log(`前端资源代理: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[系统] 收到 SIGTERM 信号,正在关闭服务器...');
  server.close(() => {
    console.log('[系统] 服务器已关闭');
    process.exit(0);
  });
});