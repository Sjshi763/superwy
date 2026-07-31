<template>
  <div class="map-tab">
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 16px; font-weight: bold;">仓库坐标地图</div>
          <el-button type="primary" size="small" @click="fetchContainerMap">刷新地图</el-button>
        </div>
      </template>

      <div v-if="loading" style="text-align: center; padding: 40px; color: #909399;">
        加载中...
      </div>
      <div v-else-if="containers.length === 0" style="text-align: center; padding: 40px; color: #909399;">
        暂无容器数据,请先执行扫描任务
      </div>
      <div v-else class="map-grid">
        <div v-for="item in containers" :key="`${item.container_x},${item.container_y},${item.container_z}`"
             class="map-container-item">
          <el-tooltip :content="`${item.item_name_zh}\n坐标: ${item.container_x}, ${item.container_y}, ${item.container_z}\n库存: ${item.count}`">
            <img class="item-icon-map" :src="getIcon(item.item_id)" :alt="item.item_name_zh" />
          </el-tooltip>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import apiService from '../services/api';
import type { ContainerItem } from '../types';

const containers = ref<ContainerItem[]>([]);
const loading = ref(false);

const fetchContainerMap = async () => {
  loading.value = true;
  try {
    const result = await apiService.getContainerMap();
    if (result.success && result.containers) {
      containers.value = result.containers;
    } else {
      ElMessage.error(result.error || '加载失败');
    }
  } catch (err) {
    console.error('加载地图数据失败:', err);
    ElMessage.error('加载地图数据失败');
  } finally {
    loading.value = false;
  }
};

const getIcon = (id: string) => {
  const shortId = id.replace('minecraft:', '');
  return `/assets/items/${shortId}.png`;
};

onMounted(() => {
  fetchContainerMap();
});
</script>

<style scoped>
.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 50px);
  gap: 0;
  min-height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f5f7fa;
  padding: 10px;
}

.map-container-item {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.map-container-item:hover {
  transform: scale(1.05);
  border-color: #409EFF;
}

.item-icon-map {
  width: 45px;
  height: 45px;
  image-rendering: pixelated;
}
</style>