<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>⚙️ 系统配置</span>
          <el-button
            type="primary"
            @click="saveConfiguration"
            :loading="saving"
            :disabled="!hasChanges"
          >
            保存配置
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 基础配置 -->
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="config" label-width="140px" class="config-form">
            <el-divider content-position="left">服务器连接</el-divider>

            <el-form-item label="服务器地址">
              <el-input v-model="config.host" placeholder="Minecraft服务器地址" />
            </el-form-item>

            <el-form-item label="服务器端口">
              <el-input-number v-model="config.port" :min="1" :max="65535" />
            </el-form-item>

            <el-form-item label="用户名">
              <el-input v-model="config.username" placeholder="Microsoft账号邮箱" />
            </el-form-item>

            <el-form-item label="游戏版本">
              <el-input v-model="config.version" placeholder="如: 1.21" />
            </el-form-item>

            <el-form-item label="认证方式">
              <el-select v-model="config.auth" style="width: 100%">
                <el-option label="Microsoft" value="microsoft" />
                <el-option label="离线" value="offline" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">路径超时设置</el-divider>

            <el-form-item label="寻路超时(ms)">
              <el-input-number v-model="config.gotoPathTimeoutMs" :min="1000" :step="1000" />
            </el-form-item>

            <el-form-item label="抓取超时(ms)">
              <el-input-number v-model="config.grabPathTimeoutMs" :min="1000" :step="1000" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- AI配置 -->
        <el-tab-pane label="AI配置" name="ai">
          <el-form :model="config.semanticParser" label-width="140px" class="config-form">
            <el-divider content-position="left">语义解析器</el-divider>

            <el-form-item label="API地址">
              <el-input v-model="config.semanticParser.baseUrl" placeholder="API Base URL" />
            </el-form-item>

            <el-form-item label="模型">
              <el-input v-model="config.semanticParser.model" placeholder="模型名称" />
            </el-form-item>

            <el-form-item label="API Key">
              <el-input
                v-model="config.semanticParser.apiKey"
                type="password"
                placeholder="API Key"
                show-password
              />
            </el-form-item>

            <el-form-item label="超时时间(ms)">
              <el-input-number v-model="config.semanticParser.timeoutMs" :min="5000" :step="5000" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 拟人化配置 -->
        <el-tab-pane label="拟人化配置" name="human">
          <el-form :model="config.拟人" label-width="140px" class="config-form">
            <el-divider content-position="left">拟人行为</el-divider>

            <el-form-item label="启用拟人化">
              <el-switch v-model="config.拟人.enabled" />
            </el-form-item>

            <el-form-item label="锁定距离">
              <el-input-number v-model="config.拟人.lockDistance" :min="1" :max="20" />
            </el-form-item>

            <el-form-item label="解锁距离">
              <el-input-number v-model="config.拟人.unlockDistance" :min="1" :max="30" />
            </el-form-item>

            <el-form-item label="注视间隔(ms)">
              <el-input-number v-model="config.拟人.lookIntervalMs" :min="50" :max="1000" :step="10" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 重置位置和区域 -->
        <el-tab-pane label="位置设置" name="position">
          <el-form label-width="140px" class="config-form">
            <el-divider content-position="left">重置位置</el-divider>

            <el-form-item label="X坐标">
              <el-input-number v-model="config.resetPosition.x" />
            </el-form-item>

            <el-form-item label="Y坐标">
              <el-input-number v-model="config.resetPosition.y" />
            </el-form-item>

            <el-form-item label="Z坐标">
              <el-input-number v-model="config.resetPosition.z" />
            </el-form-item>

            <el-divider content-position="left">扫描区域</el-divider>

            <div v-for="(area, key) in config.areas" :key="key" class="area-section">
              <el-card class="area-card">
                <template #header>
                  <div class="area-header">
                    <span>{{ area.name }}</span>
                    <el-tag size="small">{{ key }}</el-tag>
                  </div>
                </template>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="position-group">
                      <h4>最小坐标</h4>
                      <el-input-number v-model="area.min.x" placeholder="X" size="small" />
                      <el-input-number v-model="area.min.y" placeholder="Y" size="small" />
                      <el-input-number v-model="area.min.z" placeholder="Z" size="small" />
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="position-group">
                      <h4>最大坐标</h4>
                      <el-input-number v-model="area.max.x" placeholder="X" size="small" />
                      <el-input-number v-model="area.max.y" placeholder="Y" size="small" />
                      <el-input-number v-model="area.max.z" placeholder="Z" size="small" />
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { AppConfig } from '../types';
import api from '../services/api';

const config = ref<AppConfig>({
  host: '',
  port: 25565,
  username: '',
  version: '1.21',
  auth: 'microsoft',
  semanticParser: {
    baseUrl: '',
    model: '',
    apiKey: '',
    timeoutMs: 20000
  },
  resetPosition: { x: 0, y: 0, z: 0 },
  gotoPathTimeoutMs: 24000,
  grabPathTimeoutMs: 24000,
  拟人: {
    enabled: false,
    lockDistance: 4,
    unlockDistance: 6,
    lookIntervalMs: 180
  },
  areas: {}
});

const originalConfig = ref<string>('');
const activeTab = ref('basic');
const saving = ref(false);
const loading = ref(true);

// 计算是否有变化
const hasChanges = computed(() => {
  return JSON.stringify(config.value) !== originalConfig.value;
});

// 加载配置
async function loadConfiguration() {
  try {
    loading.value = true;
    const response = await api.getConfig();
    if (response.success && response.config) {
      config.value = response.config;
      originalConfig.value = JSON.stringify(response.config);
    } else {
      ElMessage.error('加载配置失败: ' + (response.error || '未知错误'));
    }
  } catch (error: any) {
    console.error('[配置加载错误]', error);
    ElMessage.error('加载配置失败: 请确保后端服务已启动 (http://localhost:3000)');
  } finally {
    loading.value = false;
  }
}

// 保存配置
async function saveConfiguration() {
  try {
    const result = await ElMessageBox.confirm(
      '确定要保存配置吗?这将立即生效。',
      '保存配置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false);

    if (!result) return;

    saving.value = true;
    const response = await api.updateConfig(config.value);

    if (response.success) {
      ElMessage.success('配置已保存');
      originalConfig.value = JSON.stringify(config.value);
    } else {
      ElMessage.error('保存配置失败: ' + (response.error || '未知错误'));
    }
  } catch (error: any) {
    ElMessage.error('保存配置失败: ' + error.message);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadConfiguration();
});
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.config-form {
  padding: 20px 40px;
}

.area-section {
  margin-bottom: 20px;
}

.area-card {
  margin-bottom: 10px;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.position-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.position-group .el-input-number {
  width: 100%;
}

:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}
</style>