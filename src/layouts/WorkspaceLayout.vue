<script setup lang="ts">
import WorkspaceHeader from '@/components/layout/WorkspaceHeader.vue'
import WorkspaceNavigation from '@/components/layout/WorkspaceNavigation.vue'
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader.vue'
</script>

<template>
  <div class="workspace-layout">
    <WorkspaceHeader />
    <div class="workspace-layout__body">
      <WorkspaceNavigation />
      <div class="workspace-layout__main">
        <WorkspacePageHeader />
        <main class="workspace-layout__content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.workspace-layout {
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
