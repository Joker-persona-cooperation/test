<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isWorkspaceNavActive, workspaceNavItems } from '@/router/workspaceNav'

const route = useRoute()
const router = useRouter()

const currentItem = computed(
  () =>
    workspaceNavItems.find((item) =>
      isWorkspaceNavActive(route.path, item.path),
    ) ?? workspaceNavItems[0],
)

const title = computed(
  () => (route.meta.title as string) || currentItem.value.label || '工作台',
)
const description = computed(
  () => (route.meta.description as string) || currentItem.value.description,
)
const statusLabel = computed(
  () => (route.meta.statusLabel as string) || 'MVP Phase 1',
)
</script>

<template>
  <div class="workspace-page-header">
    <div class="workspace-page-header__top">
      <div
        class="workspace-page-header__tabs"
        role="tablist"
        aria-label="工作台快速跳转"
      >
        <button
          v-for="item in workspaceNavItems"
          :key="item.key"
          class="workspace-page-header__tab"
          :class="{
            'is-active': isWorkspaceNavActive(route.path, item.path),
          }"
          type="button"
          @click="router.push(item.path)"
        >
          {{ item.shortLabel }}
        </button>
      </div>

      <div class="workspace-page-header__actions">
        <el-tag effect="plain">{{ statusLabel }}</el-tag>
        <el-button type="primary" round @click="router.push('/parse/new')">
          新建解析
        </el-button>
      </div>
    </div>

    <div class="workspace-page-header__meta">
      <div>
        <p class="workspace-page-header__eyebrow">Workspace</p>
        <h1 class="workspace-page-header__title">{{ title }}</h1>
        <p class="workspace-page-header__desc">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.workspace-page-header {
  flex-shrink: 0;
  padding: 16px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__tab {
    border: 1px solid var(--color-border);
    background: #f8fbfe;
    color: var(--color-text-soft);
    border-radius: 999px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;

    &:hover {
      background: var(--color-primary-soft);
      border-color: #bfdcf5;
      color: var(--color-primary-deep);
      transform: translateY(-1px);
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-soft);
  }

  &__title {
    margin: 0;
    font-size: 22px;
    color: var(--color-text);
  }

  &__desc {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-soft);
  }
}

.is-active {
  background: linear-gradient(135deg, var(--color-primary), #5bb7ff);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 10px 24px rgba(56, 165, 255, 0.24);
}

@media (max-width: 768px) {
  .workspace-page-header {
    &__top,
    &__meta {
      align-items: flex-start;
      flex-direction: column;
    }

    &__actions {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
