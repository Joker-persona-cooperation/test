<script setup lang="ts">
import { Fold, Expand, Plus } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'
import { workspaceNavItems, isWorkspaceNavActive } from '@/constants/navigation'
import { useWorkspaceSidebar } from '../composables/useWorkspaceSidebar'

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
      <span class="workspace-sidebar__brand-text">
        <strong>{{ APP_NAME }}</strong>
        <small>{{ APP_TAGLINE }}</small>
      </span>
    </div>

    <nav class="workspace-sidebar__nav" aria-label="工作台主导航">
      <router-link
        class="workspace-sidebar__create"
        to="/parse/new"
        @click="handleNavClick"
      >
        <el-icon :size="18"><Plus /></el-icon>
        <span class="workspace-sidebar__create-label">新建解析</span>
      </router-link>

      <router-link
        v-for="item in workspaceNavItems"
        :key="item.key"
        class="workspace-sidebar__item"
        :class="{
          'is-active': isWorkspaceNavActive(route.meta.navKey, item.key),
        }"
        :to="item.path"
        :title="!isDrawer && collapsed ? item.label : undefined"
        :aria-current="
          isWorkspaceNavActive(route.meta.navKey, item.key) ? 'page' : undefined
        "
        @click="handleNavClick"
      >
        <el-icon class="workspace-sidebar__icon" :size="18">
          <component :is="item.icon" />
        </el-icon>
        <span class="workspace-sidebar__label">
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
      <span class="workspace-sidebar__collapse-text">收起侧边栏</span>
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
    position: relative;
    height: 75px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    // 用水平 padding 让 logo 左对齐基准与导航项图标一致（均从 12px 起）
    padding: 0 18px;
    border-bottom: 1px solid var(--color-border);
    overflow: hidden;
    transition: padding 0.24s ease;
  }

  // 折叠态：去掉左右 padding 并居中，使 34px logo 精确落在 72px 栏宽正中，
  // 与展开态使用同一套 logo 尺寸，避免收缩/展开时 logo 横向跳动
  &.is-collapsed &__brand {
    justify-content: center;
    padding: 0;
    gap: 0;
  }

  &__logo {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    // 恒定尺寸 + 居中，确保展开/折叠两态 logo 视觉位置一致
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    // 折叠时与侧栏宽度同步淡出并收宽，避免“先跳中间再收缩”
    overflow: hidden;
    white-space: nowrap;
    transition:
      opacity 0.2s ease,
      max-width 0.24s ease;

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

  // 折叠态让文字脱离 flex 流，logo 才能精确居中，避免负 margin 干扰居中基准
  &.is-collapsed &__brand-text {
    position: absolute;
    opacity: 0;
    max-width: 0;
    pointer-events: none;
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    // 折叠态宽度收窄，隐藏滚动条避免横向溢出
    &::-webkit-scrollbar {
      width: 6px;
      height: 0;
    }
  }

  &.is-collapsed &__nav {
    overflow-y: hidden;
    padding: 12px 0;
  }

  &__create {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-control);
    background: var(--color-primary);
    color: var(--color-surface);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    transition:
      background-color 0.18s ease,
      padding 0.24s ease,
      gap 0.24s ease;

    &:hover {
      background: var(--color-primary-deep);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary-deep);
      outline-offset: 2px;
    }
  }

  &__create-label {
    overflow: hidden;
    transition:
      opacity 0.2s ease,
      max-width 0.24s ease;
  }

  &.is-collapsed &__create {
    gap: 0;
    margin: 0 10px 8px;
    padding: 10px 0;
  }

  &.is-collapsed &__create-label {
    position: absolute;
    opacity: 0;
    max-width: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    // 图标盒子固定 34px 已提供左侧基准，item 内部不再用 gap 留白，
    // 改由图标盒子自身的内边距对齐，保证展开/折叠两态图标起始位置一致
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-control);
    color: var(--color-text-soft);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    transition:
      background-color 0.18s ease,
      color 0.18s ease,
      padding 0.24s ease,
      justify-content 0.24s ease;

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
    // 折叠态：去掉左右 padding 并居中，让 34px 图标盒子整体居中，
    // 图标盒子尺寸不变，因此图标相对栏中心的基准与展开态一致，无跳动
    justify-content: center;
    gap: 0;
    padding: 10px 0;
  }

  &__icon {
    flex-shrink: 0;
    width: 34px;
    // 图标盒子在两种状态下尺寸恒定，且内部图标始终居中，
    // 切换时只有“盒子整体位置”随栏宽平移，单个图标不发生偏移
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__label {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    // 与侧栏宽度收缩同步淡出收宽
    transition:
      opacity 0.2s ease,
      max-width 0.24s ease;
  }

  // 折叠态文字脱离 flex 流，图标才能精确居中
  &.is-collapsed &__label {
    position: absolute;
    opacity: 0;
    max-width: 0;
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
    transition:
      color 0.18s ease,
      padding 0.24s ease,
      gap 0.24s ease;

    &:hover {
      color: var(--color-primary-deep);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    // 折叠按钮图标与导航图标同用 34px 盒子，保持一致的居中基准
    .el-icon {
      flex-shrink: 0;
      width: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__collapse-text {
    overflow: hidden;
    white-space: nowrap;
    transition:
      opacity 0.2s ease,
      max-width 0.24s ease;
  }

  &.is-collapsed &__collapse-text {
    opacity: 0;
    max-width: 0;
  }

  &.is-collapsed &__collapse {
    // 折叠态去掉左右 padding 并居中，使 34px 图标盒子整体居中
    gap: 0;
    padding: 14px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-sidebar,
  .workspace-sidebar__create,
  .workspace-sidebar__create-label,
  .workspace-sidebar__item,
  .workspace-sidebar__collapse,
  .workspace-sidebar__brand-text,
  .workspace-sidebar__label,
  .workspace-sidebar__collapse-text {
    transition: none;
  }
}
</style>
