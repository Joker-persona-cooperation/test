<script setup lang="ts">
import {
  Clock,
  FolderOpened,
  Management,
  Upload,
  User,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { isWorkspaceNavActive, workspaceNavItems } from '@/router/workspaceNav'

const route = useRoute()
const router = useRouter()

const iconMap = {
  dashboard: Management,
  'parse-create': Upload,
  projects: FolderOpened,
  history: Clock,
  profile: User,
}

function openItem(to: string) {
  router.push(to)
}
</script>

<template>
  <aside class="workspace-navigation">
    <div class="workspace-navigation__intro">
      <p class="workspace-navigation__title">前端接入进度</p>
      <p class="workspace-navigation__subtitle">
        已完成账号体系与工作台骨架，下一阶段接入文档录入与解析闭环。
      </p>
    </div>

    <nav class="workspace-navigation__nav">
      <button
        v-for="item in workspaceNavItems"
        :key="item.key"
        class="workspace-navigation__item"
        :class="{ 'is-active': isWorkspaceNavActive(route.path, item.path) }"
        type="button"
        @click="openItem(item.path)"
      >
        <el-icon class="workspace-navigation__icon"
          ><component :is="iconMap[item.key]"
        /></el-icon>
        <span class="workspace-navigation__label">{{ item.label }}</span>
        <small class="workspace-navigation__hint">{{ item.description }}</small>
      </button>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
.workspace-navigation {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  &__subtitle {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-text-soft);
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    padding: 12px;
    text-align: left;
    display: grid;
    grid-template-columns: 20px 1fr;
    column-gap: 10px;
    row-gap: 4px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      transform 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--color-primary-soft);
      border-color: #c6dff4;
      transform: translateY(-1px);
    }
  }

  &__icon {
    grid-row: 1 / span 2;
    margin-top: 2px;
    color: var(--color-primary-deep);
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  &__hint {
    font-size: 12px;
    color: var(--color-text-soft);
  }
}

.is-active {
  background: var(--color-primary-soft);
  border-color: #b6d8f4;
  box-shadow: inset 0 0 0 1px rgba(56, 165, 255, 0.08);
}

@media (max-width: 960px) {
  .workspace-navigation {
    display: none;
  }
}
</style>
