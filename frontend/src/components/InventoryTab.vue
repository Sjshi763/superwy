<template>
  <div class="inventory-tab">
    <!-- 状态卡片 -->
    <el-card class="status-card" shadow="always">
      <div class="header-content">
        <div style="display: flex; align-items: center; gap: 15px;">
          <h2 style="margin: 0;">📦 超级库管</h2>
          <el-tag :type="statusTagType" effect="dark">
            {{ statusTagText }}
          </el-tag>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <el-button-group>
            <el-button type="primary" size="large" @click="startScan('all')" :loading="status.status === 'scanning'">
              一键全连扫
            </el-button>
            <el-button type="danger" size="large" @click="forceRescan">
              强制重扫
            </el-button>
          </el-button-group>
        </div>
      </div>
    </el-card>

    <!-- 任务队列 -->
    <el-card class="task-queue-card" shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:16px; font-weight:bold;">任务队列</div>
            <div style="font-size:12px; color:#909399; margin-top:4px;">所有假人移动任务</div>
          </div>
          <el-button type="danger" plain @click="stopTaskQueue">
            一键终止任务队列
          </el-button>
        </div>
      </template>

      <div class="task-queue-summary">
        <div class="task-queue-metric">
          <div class="task-queue-metric-label">运行中</div>
          <div class="task-queue-metric-value">{{ taskQueue.stats.running }}</div>
        </div>
        <div class="task-queue-metric">
          <div class="task-queue-metric-label">排队中</div>
          <div class="task-queue-metric-value">{{ taskQueue.stats.pending }}</div>
        </div>
        <div class="task-queue-metric">
          <div class="task-queue-metric-label">最近完成</div>
          <div class="task-queue-metric-value">{{ taskQueue.stats.completed }}</div>
        </div>
      </div>
    </el-card>

    <!-- 物品列表 -->
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <el-radio-group v-model="filterType" size="default">
            <el-radio-button label="all">全部 ({{ counts.all }})</el-radio-button>
            <el-radio-button label="rich">充足 ({{ counts.rich }})</el-radio-button>
            <el-radio-button label="low">不足 ({{ counts.low }})</el-radio-button>
            <el-radio-button label="empty">缺货 ({{ counts.empty }})</el-radio-button>
          </el-radio-group>
          
          <el-input v-model="searchQuery" placeholder="搜索物品名称或ID..." clearable style="width: 250px;"></el-input>
        </div>
      </template>

      <el-table :data="pagedItems" border stripe style="width: 100%">
        <el-table-column label="名称 (中文)" min-width="180">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img class="item-icon" :src="getIcon(scope.row.id)" @error="(e) => handleIconError(e, scope.row.id)">
              <span style="font-weight: bold;">{{ scope.row.name_zh }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="命名空间 ID" min-width="200">
          <template #default="scope">
            <span class="namespace-id">{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.count)" size="small" effect="dark">
              {{ getStatusText(scope.row.count) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="count" label="精确总数" width="120" align="right" sortable></el-table-column>
      </el-table>

      <div v-if="items.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredItems.length"
          background
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import socketService from '../services/socket';
import type { InventoryItem, ScanStatus, TaskQueueState, SyncData } from '../types';

// 数据状态
const items = ref<InventoryItem[]>([]);
const status = ref<ScanStatus>({
  id: 'global',
  status: 'idle',
  progress: 0,
  current_pos: '',
  current_area_name: '等待指令',
  scan_areas: '',
  scan_speed: 20
});
const taskQueue = ref<TaskQueueState>({
  runningTask: null,
  pending: [],
  history: [],
  tasks: [],
  stats: { running: 0, pending: 0, completed: 0, failed: 0, cancelled: 0 }
});

// 过滤和分页
const filterType = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(50);

// 计算属性
const counts = computed(() => ({
  all: items.value.length,
  rich: items.value.filter(i => i.count >= 1728).length,
  low: items.value.filter(i => i.count > 0 && i.count < 1728).length,
  empty: items.value.filter(i => i.count === 0).length
}));

const statusTagType = computed(() => {
  if (status.value.status === 'scanning') return 'success';
  if (status.value.status === 'paused') return 'warning';
  return 'info';
});

const statusTagText = computed(() => {
  if (status.value.status === 'scanning') return 'Bot 正在工作中';
  if (status.value.status === 'paused') return '扫描已暂停';
  return '系统就绪';
});

const filteredItems = computed(() => {
  let list = [...items.value];
  
  if (filterType.value === 'rich') list = list.filter(i => i.count >= 1728);
  else if (filterType.value === 'low') list = list.filter(i => i.count > 0 && i.count < 1728);
  else if (filterType.value === 'empty') list = list.filter(i => i.count === 0);
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(i => 
      i.name_zh.toLowerCase().includes(q) || 
      i.id.toLowerCase().includes(q)
    );
  }
  
  return list.sort((a, b) => b.count - a.count);
});

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredItems.value.slice(start, end);
});

// 方法
const startScan = (mode: 'all' | string[]) => {
  socketService.startScan(mode);
  ElMessage.success('扫描任务已启动');
};

const forceRescan = () => {
  ElMessageBox.confirm('强制重扫将清空所有库存数据,是否继续?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    socketService.forceRescan();
    ElMessage.success('强制重扫任务已启动');
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

const stopTaskQueue = () => {
  ElMessageBox.confirm('确认终止当前任务队列?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    socketService.stopTaskQueue();
    ElMessage.success('已发送终止指令');
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

const getIcon = (id: string) => {
  const shortId = id.replace('minecraft:', '');
  return `/assets/items/${shortId}.png`;
};

const handleIconError = (e: Event, id: string) => {
  const target = e.target as HTMLImageElement;
  const shortId = id.replace('minecraft:', '');
  target.src = `/assets/blocks/${shortId}.png`;
};

const getStatusTag = (count: number) => {
  if (count >= 1728) return 'success';
  if (count > 0) return 'warning';
  return 'danger';
};

const getStatusText = (count: number) => {
  if (count >= 1728) return '充足';
  if (count > 0) return '即将缺货';
  return '缺货';
};

// Socket 事件处理
const handleSync = (data: SyncData) => {
  items.value = data.items;
  if (data.status) {
    status.value = data.status;
  }
  if (data.taskQueue) {
    taskQueue.value = data.taskQueue;
  }
};

const handleTaskQueueUpdate = (data: TaskQueueState) => {
  taskQueue.value = data;
};

onMounted(() => {
  socketService.on('sync', handleSync);
  socketService.on('task_queue_update', handleTaskQueueUpdate);
});

onUnmounted(() => {
  socketService.off('sync', handleSync);
  socketService.off('task_queue_update', handleTaskQueueUpdate);
});
</script>

<style scoped>
.status-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border-left: 5px solid #409EFF;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-queue-card {
  margin-bottom: 20px;
}

.task-queue-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.task-queue-metric {
  background: linear-gradient(135deg, #f7fbff 0%, #eef5ff 100%);
  border: 1px solid #dbe7ff;
  border-radius: 8px;
  padding: 14px 16px;
}

.task-queue-metric-label {
  color: #606266;
  font-size: 12px;
  margin-bottom: 8px;
}

.task-queue-metric-value {
  color: #1f2d3d;
  font-size: 22px;
  font-weight: 700;
}

.item-icon {
  width: 32px;
  height: 32px;
  vertical-align: middle;
  margin-right: 12px;
  image-rendering: pixelated;
}

.namespace-id {
  color: #909399;
  font-family: monospace;
  font-size: 11px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  background: #fff;
  padding: 15px;
  border-radius: 4px;
}
</style>