# 超级无影仓库管理系统

基于 Node.js + Vue 3 + TypeScript 的 Minecraft 仓库自动化管理系统

## 🏗️ 项目架构

项目已完成前后端物理分离:

```
superwy/
├── backend/                # 后端服务 (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts       # 主入口文件
│   │   ├── db.ts          # 数据库模块
│   │   ├── config.ts      # 配置文件
│   │   └── types/         # TypeScript 类型定义
│   ├── dist/              # 编译输出目录
│   ├── uploads/           # 文件上传目录
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # 前端应用 (Vue 3 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # Vue 组件
│   │   ├── services/      # API 和 Socket 服务
│   │   ├── types/         # TypeScript 类型
│   │   ├── App.vue
│   │   └── main.ts
│   ├── public/            # 静态资源 (blocks/items 图片)
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml     # Docker 编排文件
├── .env.example          # 环境变量模板
└── README.md
```

## 🚀 快速开始

### 开发环境启动

**方式一: 直接启动 (推荐开发使用)**

1. **克隆并进入项目**
```bash
cd superwy
```

2. **安装依赖**
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件,填入实际配置
```

4. **启动后端服务**
```bash
cd backend
npm run dev
# 后端运行在 http://localhost:3000
```

5. **启动前端开发服务器**
```bash
cd ../frontend
npm run dev
# 前端运行在 http://localhost:5173
```

**方式二: Docker 启动 (生产环境)**

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产部署

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 编译后端
cd ../backend
npm run build

# 3. 启动生产服务
npm start
```

## 📋 功能特性

### 库存盘点
- 一键全连扫 (左/右/大宗/不可堆叠区域)
- 强制重扫
- 暂停/续扫
- 扫描速度调节
- 实时进度显示

### 仓库地图
- 容器位置可视化
- 多层级视图 (支持 Y 轴高度)
- 悬停查看库存详情
- 低库存预警 (黄色/红色标记)

### 材料计算器
- Litematica 文件解析
- 建筑材料自动对比
- 缺少物品清单生成
- 库存充足/不足/缺少分类

### 任务队列
- 移动任务串行执行
- 任务状态实时跟踪
- 一键终止任务队列

## 🔧 技术栈

### 后端
- **Node.js** - 运行环境
- **Express 5** - Web 框架
- **Socket.IO** - 实时通信
- **TypeScript** - 类型系统
- **better-sqlite3** - SQLite 数据库
- **mineflayer** - Minecraft Bot 框架

### 前端
- **Vue 3** - 前端框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具
- **Element Plus** - UI 组件库
- **Socket.IO Client** - 实时通信

### 部署
- **Docker** - 容器化
- **nginx** - 前端静态资源服务器

## 📖 API 文档

### REST API

#### 获取物品容器位置
```
GET /api/container-locations/:itemId
```

#### 获取容器地图
```
GET /api/container-map
```

#### Litematica 文件上传
```
POST /api/litematica
Content-Type: multipart/form-data
```

#### 健康检查
```
GET /api/health
```

### Socket.IO 事件

#### 客户端 -> 服务端
- `command_scan` - 启动扫描
- `command_force_rescan` - 强制重扫
- `command_stop_scan` - 停止扫描
- `command_set_scan_speed` - 设置扫描速度
- `command_resume_scan` - 续扫
- `command_stop_task_queue` - 终止任务队列

#### 服务端 -> 客户端
- `sync` - 同步库存数据
- `task_queue_update` - 任务队列更新
- `scan_speed_response` - 扫描速度响应

## 🔒 安全配置

前端已集成密码保护:
- 访问密码: `pzmf1234` (可在 `App.vue` 中修改)
- 使用 sessionStorage 存储 auth 状态

生产环境建议:
- 修改默认密码
- 启用 HTTPS
- 配置防火墙规则

## 📝 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MC_HOST` | Minecraft 服务器地址 | `yourdomainhere` |
| `MC_PORT` | Minecraft 服务器端口 | `25565` |
| `MC_USERNAME` | Minecraft 用户名 | `microsoftaccountmail` |
| `MC_AUTH` | 认证方式 | `microsoft` |
| `LLM_API_BASE_URL` | LLM API 地址 | - |
| `LLM_MODEL` | LLM 模型名称 | `qwen3.5-plus` |
| `LLM_API_KEY` | LLM API 密钥 | - |
| `WEB_PORT` | 后端端口 | `3000` |
| `FRONTEND_URL` | 前端 URL | `http://localhost:5173` |

## 🛠️ 开发指南

### 添加新的 API 端点

1. 在 `backend/src/index.ts` 中添加路由
2. 在 `frontend/src/services/api.ts` 中添加调用方法
3. 在对应的 Vue 组件中使用

### 添加新的 Socket 事件

1. 在 `backend/src/index.ts` 的 `io.on()` 中添加事件监听
2. 在 `frontend/src/services/socket.ts` 中添加发送方法
3. 在组件中通过 `socketService.on()` 监听响应

### 类型定义

- 后端类型: `backend/src/types/index.ts`
- 前端类型: `frontend/src/types/index.ts`
- 保持两端类型定义同步

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

**开发者**: 超级无影团队  
**最后更新**: 2026-07-31