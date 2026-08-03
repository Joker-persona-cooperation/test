<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Expand, Moon, Plus, Sunny } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { findWorkspaceNavItem } from '@/constants/navigation'
import { useWorkspaceSidebar } from '../composables/useWorkspaceSidebar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { openMobileNav } = useWorkspaceSidebar()
const { isDark, themeToggleLabel, toggleTheme } = useTheme()

const currentItem = computed(() => findWorkspaceNavItem(route.path))

const title = computed(
  () => route.meta.title ?? currentItem.value?.label ?? '工作台',
)
const description = computed(
  () => route.meta.description ?? currentItem.value?.description ?? '',
)
const statusLabel = computed(() => route.meta.statusLabel)

// 新建解析是全局主动作，但在该页自身没有意义，避免自跳转的空点击
const showCreateAction = computed(() => route.name !== 'parse-create')

const displayName = computed(
  () => authStore.userInfo?.nickname || authStore.userInfo?.email || '未登录',
)
const avatarText = computed(() => displayName.value.slice(0, 1).toUpperCase())

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出当前账号？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 用户取消退出
    return
  }
  await authStore.logout()
  ElMessage.success('已退出登录')
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="workspace-topbar">
    <div class="workspace-topbar__main">
      <button
        class="workspace-topbar__nav-toggle"
        type="button"
        aria-label="打开导航菜单"
        @click="openMobileNav"
      >
        <el-icon :size="18"><Expand /></el-icon>
      </button>

      <div class="workspace-topbar__heading">
        <div class="workspace-topbar__title-row">
          <h1>{{ title }}</h1>
          <el-tag v-if="statusLabel" size="small" effect="plain" type="info">
            {{ statusLabel }}
          </el-tag>
        </div>
        <p v-if="description">{{ description }}</p>
      </div>
    </div>

    <div class="workspace-topbar__actions">
      <el-button
        v-if="showCreateAction"
        type="primary"
        :icon="Plus"
        @click="router.push({ name: 'parse-create' })"
      >
        新建解析
      </el-button>

      <button
        class="workspace-topbar__theme-toggle"
        type="button"
        role="switch"
        :class="{ 'is-dark': isDark }"
        :title="themeToggleLabel"
        :aria-label="themeToggleLabel"
        :aria-checked="isDark"
        @click="toggleTheme"
      >
        <el-icon
          class="workspace-topbar__theme-icon"
          :class="{ 'is-dark': isDark }"
          aria-hidden="true"
        >
          <Sunny v-if="isDark" />
          <Moon v-else />
        </el-icon>
      </button>
      <el-dropdown trigger="click">
        <button class="workspace-topbar__user" type="button">
          <span class="workspace-topbar__avatar" aria-hidden="true">
            {{ avatarText }}
          </span>
          <span class="workspace-topbar__user-name">{{ displayName }}</span>
          <el-icon :size="12"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push({ name: 'profile' })">
              个人中心
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.workspace-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &__main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__nav-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--color-text-soft);
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__heading {
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 19px;
      font-weight: 700;
      color: var(--color-text);
    }

    p {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--color-text-soft);
      // 描述只是辅助说明，截断以保证顶栏高度稳定
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__theme-toggle {
    position: relative;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-bg);
    color: var(--color-text-soft);
    cursor: pointer;
    overflow: hidden;
    transition:
      color 0.25s ease,
      border-color 0.25s ease,
      background-color 0.25s ease,
      box-shadow 0.25s ease;

    // 暗色下的轨道高亮环，提供状态辨识度
    &::before {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      border: 1.5px solid transparent;
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;
      pointer-events: none;
    }

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
      color: var(--color-primary-deep);
      box-shadow: 0 4px 14px rgba(56, 165, 255, 0.18);
    }

    &:active {
      transform: scale(0.92);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    // 暗色模式：暖金色太阳 + 高亮轨道，呼应提提交的视觉风格
    &.is-dark {
      border-color: rgba(102, 186, 255, 0.5);
      background: var(--color-primary-soft);
      color: #ffd166;

      &::before {
        border-color: rgba(255, 209, 102, 0.55);
        box-shadow:
          0 0 0 1px rgba(255, 209, 102, 0.18),
          inset 0 0 8px rgba(255, 209, 102, 0.25);
      }
    }
  }

  &__theme-icon {
    position: relative;
    z-index: 1;
    font-size: 18px;
    // 提交中的核心动画：暗色时图标旋转 360° 过渡
    transition:
      transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.2s ease;

    &.is-dark {
      transform: rotate(360deg);
    }
  }

  // hover 时图标轻微回弹，增强反馈
  &__theme-toggle:hover &__theme-icon {
    transform: rotate(16deg);
  }

  &__theme-toggle.is-dark:hover &__theme-icon {
    transform: rotate(376deg);
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px 5px 5px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    color: var(--color-text);
    font-size: 13px;
    cursor: pointer;
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__avatar {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary-deep)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
  }

  &__user-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 960px) {
  .workspace-topbar {
    padding: 12px 16px;

    &__nav-toggle {
      display: inline-flex;
    }

    &__heading p,
    &__user-name {
      display: none;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-topbar__user,
  .workspace-topbar__theme-toggle,
  .workspace-topbar__theme-icon,
  .workspace-topbar__theme-toggle::before {
    transition: none;
  }

  .workspace-topbar__theme-icon.is-dark {
    transform: none;
  }
}
</style>
