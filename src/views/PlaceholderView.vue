<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Document } from '@element-plus/icons-vue'

// 占位页：导航指向的各模块具体内容暂未实现，统一展示开发中提示
const route = useRoute()
const title = computed(() => (route.meta.title as string) || 'TaskPilot')
</script>

<template>
  <div class="placeholder">
    <div class="placeholder__card">
      <el-icon class="placeholder__icon"><Document /></el-icon>
      <h2 class="placeholder__title">{{ title }}</h2>
      <p class="placeholder__desc">该模块正在开发中，敬请期待。</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.placeholder {
  display: flex;
  justify-content: center;

  &__card {
    width: 100%;
    max-width: 560px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 48px 32px;
    text-align: center;
  }

  &__icon {
    font-size: 48px;
    color: var(--color-border);
    margin-bottom: 16px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text);
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-soft);
  }
}
</style>
