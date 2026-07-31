import { io, Socket } from 'socket.io-client';
import type { SyncData, ScanStatus, TaskQueueState } from '../types';

class SocketService {
  private socket: Socket;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('[Socket] 已连接到服务器');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] 与服务器断开连接');
    });

    this.socket.on('sync', (data: SyncData) => {
      this.emit('sync', data);
    });

    this.socket.on('task_queue_update', (state: TaskQueueState) => {
      this.emit('task_queue_update', state);
    });

    this.socket.on('scan_speed_response', (response: { success: boolean; scan_speed?: number; error?: string }) => {
      this.emit('scan_speed_response', response);
    });
  }

  // 发送扫描指令
  startScan(mode: 'all' | string[]) {
    this.socket.emit('command_scan', mode);
  }

  // 强制重扫
  forceRescan() {
    this.socket.emit('command_force_rescan');
  }

  // 停止扫描
  stopScan() {
    this.socket.emit('command_stop_scan');
  }

  // 停止任务队列
  stopTaskQueue() {
    this.socket.emit('command_stop_task_queue');
  }

  // 设置扫描速度
  setScanSpeed(speed: number) {
    this.socket.emit('command_set_scan_speed', speed);
  }

  // 续扫
  resumeScan() {
    this.socket.emit('command_resume_scan');
  }

  // 事件监听
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // 移除监听
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  // 触发事件
  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(callback => {
      callback(...args);
    });
  }

  // 断开连接
  disconnect() {
    this.socket.disconnect();
  }
}

export default new SocketService();