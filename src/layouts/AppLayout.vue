<script setup lang="ts">
// TODO: 主应用布局容器
// 结构：顶部导航栏(AppHeader) + 主体(左侧菜单 AppSidebar + 右侧 AppTabs + 主区域 router-view)
// 后续接入路由时，业务页（dashboard / parse / projects 等）作为该布局的子路由
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTabs from '@/components/layout/AppTabs.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <div class="app-layout__body">
      <AppSidebar />
      <div class="app-layout__main">
        <AppTabs />
        <main class="app-layout__content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);

  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__content {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }
}
</style>
