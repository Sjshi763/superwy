import { AppConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

// 从根目录读取配置文件
const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');

let config: AppConfig;

// 加载配置文件
function loadConfig(): AppConfig {
  try {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

// 初始加载
config = loadConfig();

// 重新加载配置
export function reloadConfig(): AppConfig {
  config = loadConfig();
  return config;
}

// 保存配置
export function saveConfig(newConfig: AppConfig): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    config = newConfig;
  } catch (error) {
    throw new Error(`Failed to save config to ${configPath}: ${error}`);
  }
}

// 获取配置文件路径
export function getConfigPath(): string {
  return configPath;
}

export default config;