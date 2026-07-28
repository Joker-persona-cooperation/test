<script setup lang="ts">
// TODO: 左侧菜单
// 预期内容：工作台 / 文档解析 / 项目任务 / 历史记录 / 个人中心 等导航项
</script>

<template>
  <aside class="app-sidebar">
    <nav class="app-sidebar__nav"><!-- TODO: 菜单项 --></nav>
  </aside>
</template>

<style lang="scss" scoped>
.app-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 12px 8px;

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
