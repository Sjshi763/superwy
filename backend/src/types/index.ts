// 核心类型定义文件

import { Bot } from 'mineflayer';

// 数据库表结构
export interface InventoryItem {
  id: string;
  name_zh: string;
  count: number;
  last_updated?: string;
}

export interface ItemLocation {
  id?: number;
  item_id: string;
  chest_x: number;
  chest_y: number;
  chest_z: number;
  count: number;
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

export interface ContainerItem {
  id?: number;
  container_x: number;
  container_y: number;
  container_z: number;
  item_id: string;
  item_name_zh: string;
  count: number;
  last_updated?: string;
}

// 配置结构
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

// Socket 事件
export interface ClientToServerEvents {
  command_scan: (mode: 'all' | string[]) => void;
  command_force_rescan: () => void;
  command_stop_scan: () => void;
  command_stop_task_queue: () => void;
  command_set_scan_speed: (speed: number) => void;
  command_resume_scan: () => void;
}

export interface ServerToClientEvents {
  sync: (data: {
    items: InventoryItem[];
    status: ScanStatus;
    taskQueue: TaskQueueState;
  }) => void;
  task_queue_update: (state: TaskQueueState) => void;
  scan_speed_response: (response: { success: boolean; scan_speed?: number; error?: string }) => void;
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

// Litematica 相关
export interface LitematicaMetadata {
  Name?: string;
  Author?: string;
  TimeCreated?: number;
  TimeModified?: number;
  TotalBlocks?: number;
}

export interface MaterialComparison {
  material: string;
  required: number;
  available: number;
  lacking?: number;
  name_zh?: string;
  name_en?: string;
}

// API 响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}