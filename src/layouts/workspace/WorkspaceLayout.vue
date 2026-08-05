<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import WorkspaceSidebar from './components/WorkspaceSidebar.vue'
import WorkspaceTopbar from './components/WorkspaceTopbar.vue'
import { useWorkspaceSidebar } from './composables/useWorkspaceSidebar'

const { mobileNavOpen, closeMobileNav } = useWorkspaceSidebar()
const router = useRouter()
const contentEl = ref<HTMLElement>()
const scrollPositions = new Map<string, number>()

const removeBeforeGuard = router.beforeEach((_to, from) => {
  if (contentEl.value) {
    scrollPositions.set(from.fullPath, contentEl.value.scrollTop)
  }
  return true
})

const removeAfterHook = router.afterEach(async (to) => {
  await nextTick()
  contentEl.value?.scrollTo({ top: scrollPositions.get(to.fullPath) ?? 0 })
})

onBeforeUnmount(() => {
  removeBeforeGuard()
  removeAfterHook()
})
</script>

<template>
  <div class="workspace-layout">
    <WorkspaceSidebar class="workspace-layout__sidebar" />

    <div class="workspace-layout__main">
      <WorkspaceTopbar />
      <main ref="contentEl" class="workspace-layout__content">
        <div class="workspace-layout__content-inner">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
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
  height: 100dvh;
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

  &__content-inner {
    width: 100%;
    max-width: 1280px;
    min-height: 100%;
    margin: 0 auto;
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
