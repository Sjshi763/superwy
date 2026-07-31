import type { ContainerItem, AppConfig } from '../types';

const API_BASE = '/api';

class ApiService {
  // 获取物品的容器位置
  async getContainerLocations(itemId: string): Promise<{
    success: boolean;
    containers?: ContainerItem[];
    error?: string;
  }> {
    try {
      const fullItemId = itemId.startsWith('minecraft:') ? itemId : itemId;
      const response = await fetch(`${API_BASE}/container-locations/${fullItemId}`);
      return await response.json();
    } catch (error: any) {
      console.error('[API错误]', error);
      return { success: false, error: error.message };
    }
  }

  // 获取容器地图
  async getContainerMap(): Promise<{
    success: boolean;
    containers?: ContainerItem[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/container-map`);
      return await response.json();
    } catch (error: any) {
      console.error('[API错误]', error);
      return { success: false, error: error.message };
    }
  }

  // 上传 Litematica 文件
  async uploadLitematica(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/litematica`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error: any) {
      console.error('[上传错误]', error);
      return { success: false, error: error.message };
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  }

  // 获取配置
  async getConfig(): Promise<{
    success: boolean;
    config?: AppConfig;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/config`);
      return await response.json();
    } catch (error: any) {
      console.error('[API错误]', error);
      return { success: false, error: error.message };
    }
  }

  // 更新配置
  async updateConfig(config: AppConfig): Promise<{
    success: boolean;
    config?: AppConfig;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      return await response.json();
    } catch (error: any) {
      console.error('[API错误]', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();