<script setup lang="ts">
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  Upload,
  Folder,
  Clock,
  User,
} from '@element-plus/icons-vue'

// 左侧导航菜单：与 goals 示例一致的工作台/新建解析/项目管理/历史记录/个人中心
interface MenuItem {
  path: string
  title: string
  icon: Component
}

const route = useRoute()

const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '工作台', icon: HomeFilled },
  { path: '/parse/new', title: '新建解析', icon: Upload },
  { path: '/projects', title: '项目管理', icon: Folder },
  { path: '/history', title: '历史记录', icon: Clock },
  { path: '/profile', title: '个人中心', icon: User },
]

// 工作台使用精确匹配；新建解析匹配整个 /parse 前缀（含处理中/结果子页）；其余菜单支持子路由高亮
function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  if (path === '/parse/new') return route.path.startsWith('/parse')
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">T</div>
      <span class="logo-text">TaskPilot</span>
    </div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <el-icon class="sidebar-nav-icon"><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
.app-sidebar {
  width: 240px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.sidebar-logo {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 22px;
  border-bottom: 1px solid var(--color-border);

  .logo-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary-deep)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
  }

  .logo-text {
    font-size: 19px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.3px;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-soft);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  user-select: none;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary-deep);
  }

  &.active {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 8px rgba(56, 165, 255, 0.35);
  }
}

.sidebar-nav-icon {
  font-size: 18px;
}
</style>
