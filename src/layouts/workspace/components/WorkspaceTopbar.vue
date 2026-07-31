<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Expand, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { findWorkspaceNavItem } from '@/constants/navigation'
import { useWorkspaceSidebar } from '../composables/useWorkspaceSidebar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { openMobileNav } = useWorkspaceSidebar()

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
  .workspace-topbar__user {
    transition: none;
  }
}
</style>
