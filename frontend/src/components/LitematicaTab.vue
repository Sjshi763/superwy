<template>
  <div class="litematica-tab">
    <el-card shadow="hover">
      <template #header>
        <div style="font-size: 16px; font-weight: bold;">Litematica 建筑材料计算</div>
      </template>

      <div style="padding: 20px; text-align: center;">
        <el-upload
          drag
          action="/api/litematica"
          accept=".litematic"
          :on-success="handleSuccess"
          :on-error="handleError"
          style="margin-bottom: 20px;"
        >
          <div style="padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
            <div style="font-size: 16px; font-weight: bold;">拖拽 Litematica 文件到此处</div>
          </div>
        </el-upload>

        <div v-if="result" style="text-align: left;">
          <el-result v-if="result.error" icon="error" title="解析失败" :sub-title="result.error" />
          
          <div v-else>
            <el-statistic title="物品总类" :value="result.summary?.totalTypes || 0" />
            <el-statistic title="库存充足" :value="result.summary?.sufficient || 0" />
            <el-statistic title="库存不足" :value="result.summary?.insufficient || 0" />
            <el-statistic title="缺少物品" :value="result.summary?.missing || 0" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { LitematicaResult } from '../types';

const result = ref<LitematicaResult | null>(null);

const handleSuccess = (response: any) => {
  if (response.success) {
    result.value = response;
    ElMessage.success('文件解析成功!');
  } else {
    result.value = { error: response.error || '解析失败' };
    ElMessage.error('解析失败');
  }
};

const handleError = (err: any) => {
  ElMessage.error('文件上传失败');
  result.value = { error: err.message || '上传失败' };
};
</script>

<style scoped>
.el-statistic {
  margin-right: 40px;
  display: inline-block;
}
</style>