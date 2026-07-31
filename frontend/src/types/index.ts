// 前端类型定义 (与后端保持同步)

// 数据库表结构
export interface InventoryItem {
  id: string;
  name_zh: string;
  count: number;
  locations?: string;
  last_updated?: string;
}

export interface ScanStatus {
  id: string;
  status: 'idle' | 'scanning' | 'paused';
  progress: number;
  current_pos: string;
  current_area_name: string;
  scan_areas: string;
  scan_speed: number;
}

// 任务队列
export interface TaskQueueTask {
  id: number;
  title: string;
  target?: string;
  source?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

export interface TaskQueueState {
  runningTask: TaskQueueTask | null;
  pending: TaskQueueTask[];
  history: TaskQueueTask[];
  tasks: TaskQueueTask[];
  stats: {
    running: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}

// 容器项
export interface ContainerItem {
  container_x: number;
  container_y: number;
  container_z: number;
  item_id: string;
  item_name_zh: string;
  count: number;
}

// Litematica 结果
export interface LitematicaResult {
  error?: string;
  metadata?: {
    name: string;
    author: string;
    total_blocks: number;
    time_modified: number;
  };
  materials?: Record<string, number>;
  comparison?: {
    sufficient: MaterialComparison[];
    insufficient: MaterialComparison[];
    missing: MaterialComparison[];
  };
  summary?: {
    totalTypes: number;
    sufficient: number;
    insufficient: number;
    missing: number;
  };
}

export interface MaterialComparison {
  material: string;
  required: number;
  available: number;
  lacking?: number;
  name_zh?: string;
  name_en?: string;
}

// Socket 同步数据
export interface SyncData {
  items: InventoryItem[];
  status: ScanStatus;
  taskQueue: TaskQueueState;
}

// 配置类型定义
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ScanArea {
  name: string;
  min: Position;
  max: Position;
}

export interface SemanticParserConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
}

export interface HumanBehaviorConfig {
  enabled: boolean;
  lockDistance: number;
  unlockDistance: number;
  lookIntervalMs: number;
}

export interface AppConfig {
  host: string;
  port: number;
  username: string;
  version: string;
  auth: 'microsoft' | 'offline';
  semanticParser: SemanticParserConfig;
  resetPosition: Position;
  gotoPathTimeoutMs: number;
  grabPathTimeoutMs: number;
  拟人: HumanBehaviorConfig;
  areas: Record<string, ScanArea>;
}