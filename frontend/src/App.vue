<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 库存盘点标签 -->
      <el-tab-pane label="📦 库存盘点" name="inventory">
        <InventoryTab />
      </el-tab-pane>

      <!-- 仓库地图标签 -->
      <el-tab-pane label="📍 平铺画面" name="map">
        <MapTab />
      </el-tab-pane>

      <!-- Litematica 材料计算器标签 -->
      <el-tab-pane label="🏗️ 材料计算器" name="litematica">
        <LitematicaTab />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InventoryTab from './components/InventoryTab.vue';
import MapTab from './components/MapTab.vue';
import LitematicaTab from './components/LitematicaTab.vue';

const activeTab = ref('inventory');
</script>

<style>
body {
  margin: 0;
  background-color: #f5f7fa;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.app-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>