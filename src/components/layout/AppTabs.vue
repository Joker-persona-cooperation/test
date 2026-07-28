<script setup lang="ts">
// TODO: Tab 菜单（页签）
// 预期内容：已打开页面的页签栏，支持切换/关闭；与路由联动
</script>

<template>
  <div class="app-tabs"><!-- TODO: 页签列表 --></div>
</template>

<style lang="scss" scoped>
.app-tabs {
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
</style>
