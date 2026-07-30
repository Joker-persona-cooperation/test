<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  icon?: Component
}>()
</script>

<template>
  <section class="app-panel">
    <header class="app-panel__header">
      <h2 class="app-panel__title">
        <el-icon v-if="icon" :size="16"><component :is="icon" /></el-icon>
        <span>{{ title }}</span>
      </h2>
      <div v-if="$slots.extra" class="app-panel__extra">
        <slot name="extra" />
      </div>
    </header>
    <slot />
  </section>
</template>

<style lang="scss" scoped>
.app-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 20px 22px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }
}
</style>
