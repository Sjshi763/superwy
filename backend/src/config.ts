import { AppConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

// 从根目录读取配置文件
const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');

let config: AppConfig;
try {
  const configFile = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configFile);
} catch (error) {
  throw new Error(`Failed to load config from ${configPath}: ${error}`);
}

export default config;