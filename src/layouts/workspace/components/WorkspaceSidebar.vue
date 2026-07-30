<script setup lang="ts">
import { Fold, Expand } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'
import { workspaceNavItems, isWorkspaceNavActive } from '@/constants/navigation'
import { useWorkspaceSidebar } from '@/composables/useWorkspaceSidebar'

const props = withDefaults(defineProps<{ variant?: 'desktop' | 'drawer' }>(), {
  variant: 'desktop',
})

const route = useRoute()
const { collapsed, toggleCollapsed, closeMobileNav } = useWorkspaceSidebar()

// 抽屉形态不支持折叠，且点击导航后要顺带收起抽屉
const isDrawer = props.variant === 'drawer'

function handleNavClick() {
  if (isDrawer) closeMobileNav()
}
</script>

<template>
  <aside
    class="workspace-sidebar"
    :class="{
      'is-collapsed': !isDrawer && collapsed,
      'is-drawer': isDrawer,
    }"
  >
    <div class="workspace-sidebar__brand">
      <span class="workspace-sidebar__logo" aria-hidden="true">T</span>
      <span v-if="isDrawer || !collapsed" class="workspace-sidebar__brand-text">
        <strong>{{ APP_NAME }}</strong>
        <small>{{ APP_TAGLINE }}</small>
      </span>
    </div>

    <nav class="workspace-sidebar__nav" aria-label="工作台主导航">
      <router-link
        v-for="item in workspaceNavItems"
        :key="item.key"
        class="workspace-sidebar__item"
        :class="{ 'is-active': isWorkspaceNavActive(route.path, item.path) }"
        :to="item.path"
        :title="!isDrawer && collapsed ? item.label : undefined"
        :aria-current="
          isWorkspaceNavActive(route.path, item.path) ? 'page' : undefined
        "
        @click="handleNavClick"
      >
        <el-icon class="workspace-sidebar__icon" :size="18">
          <component :is="item.icon" />
        </el-icon>
        <span v-if="isDrawer || !collapsed" class="workspace-sidebar__label">
          {{ item.label }}
        </span>
      </router-link>
    </nav>

    <button
      v-if="!isDrawer"
      class="workspace-sidebar__collapse"
      type="button"
      :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
      :aria-expanded="!collapsed"
      @click="toggleCollapsed"
    >
      <el-icon :size="16">
        <Expand v-if="collapsed" />
        <Fold v-else />
      </el-icon>
      <span v-if="!collapsed">收起侧边栏</span>
    </button>
  </aside>
</template>

<style lang="scss" scoped>
.workspace-sidebar {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width 0.24s ease;

  &.is-collapsed {
    width: 72px;
  }

  &.is-drawer {
    width: 100%;
    border-right: 0;
  }

  &__brand {
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    border-bottom: 1px solid var(--color-border);
  }

  &.is-collapsed &__brand {
    justify-content: center;
    padding: 0;
  }

  &__logo {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary-deep)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
  }

  &__brand-text {
    min-width: 0;
    display: flex;
    flex-direction: column;

    strong {
      font-size: 17px;
      color: var(--color-text);
      letter-spacing: -0.2px;
    }

    small {
      font-size: 11px;
      color: var(--color-text-soft);
    }
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-control);
    color: var(--color-text-soft);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    transition:
      background-color 0.18s ease,
      color 0.18s ease;

    &:hover {
      background: var(--color-primary-soft);
      color: var(--color-primary-deep);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &.is-active {
      background: var(--color-primary-soft);
      color: var(--color-primary-deep);
      font-weight: 600;
    }
  }

  &.is-collapsed &__item {
    justify-content: center;
    padding: 10px 0;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__collapse {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 12px;
    border: 0;
    border-top: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-soft);
    font-size: 13px;
    cursor: pointer;
    transition: color 0.18s ease;

    &:hover {
      color: var(--color-primary-deep);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-sidebar,
  .workspace-sidebar__item,
  .workspace-sidebar__collapse {
    transition: none;
  }
}
</style>
