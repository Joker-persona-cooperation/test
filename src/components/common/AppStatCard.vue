<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: number | string
  icon: Component
  /** 语义色 token 名，对应 variables.scss 中的 --color-* */
  tone?: 'primary' | 'warning' | 'success' | 'danger'
}>()
</script>

<template>
  <article class="app-stat-card" :class="`is-${tone ?? 'primary'}`">
    <span class="app-stat-card__icon" aria-hidden="true">
      <el-icon :size="20"><component :is="icon" /></el-icon>
    </span>
    <div class="app-stat-card__body">
      <p class="app-stat-card__value">{{ value }}</p>
      <p class="app-stat-card__label">{{ label }}</p>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.app-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);

  &__icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--stat-bg);
    color: var(--stat-color);
  }

  &__body {
    min-width: 0;
  }

  &__value {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  &__label {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--color-text-soft);
  }

  // tone → 色对的映射集中在这里，调用方只传语义 tone；
  // 具体色值全部来自 variables.scss，组件内不出现 hex
  &.is-primary {
    --stat-bg: var(--color-primary-soft);
    --stat-color: var(--color-primary-deep);
  }

  &.is-warning {
    --stat-bg: var(--color-warning-soft);
    --stat-color: var(--color-warning-deep);
  }

  &.is-success {
    --stat-bg: var(--color-success-soft);
    --stat-color: var(--color-success-deep);
  }

  &.is-danger {
    --stat-bg: var(--color-danger-soft);
    --stat-color: var(--color-danger-deep);
  }
}
</style>
