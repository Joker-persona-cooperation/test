<script setup lang="ts">
// TODO: 顶部导航栏
// 预期内容：品牌标识、全局搜索、当前用户头像/昵称、退出登录
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">TaskPilot</div>
    <div class="app-header__actions"><!-- TODO: 用户信息 / 退出登录 --></div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &__brand {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }
}
</style>
