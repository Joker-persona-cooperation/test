<script setup lang="ts">
import WorkspaceSidebar from './components/WorkspaceSidebar.vue'
import WorkspaceTopbar from './components/WorkspaceTopbar.vue'
import { useWorkspaceSidebar } from '@/composables/useWorkspaceSidebar'

const { mobileNavOpen, closeMobileNav } = useWorkspaceSidebar()
</script>

<template>
  <div class="workspace-layout">
    <WorkspaceSidebar class="workspace-layout__sidebar" />

    <div class="workspace-layout__main">
      <WorkspaceTopbar />
      <main class="workspace-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 窄屏下侧边栏改为抽屉呈现，导航项复用同一组件 -->
    <el-drawer
      v-model="mobileNavOpen"
      direction="ltr"
      size="252px"
      :with-header="false"
      class="workspace-layout__drawer"
      @close="closeMobileNav"
    >
      <WorkspaceSidebar variant="drawer" />
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.workspace-layout {
  height: 100vh;
  display: flex;
  background: var(--color-bg);

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
}

@media (max-width: 960px) {
  .workspace-layout {
    &__sidebar {
      display: none;
    }

    &__content {
      padding: 16px;
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: none;
  }
}
</style>

<style lang="scss">
// 抽屉内容由 WorkspaceSidebar 自带内边距，这里清掉 Element Plus 的默认留白
.workspace-layout__drawer .el-drawer__body {
  padding: 0;
}
</style>
