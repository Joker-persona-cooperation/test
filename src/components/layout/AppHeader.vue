<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 页面标题取自路由 meta，回退到品牌名
const pageTitle = computed(() => (route.meta.title as string) || 'TaskPilot')

const avatarText = computed(() => {
  const name = authStore.userInfo?.nickname || authStore.userInfo?.email || ''
  return name ? name.charAt(0).toUpperCase() : 'U'
})

const userName = computed(
  () => authStore.userInfo?.nickname || authStore.userInfo?.email || '未登录',
)

function goParse() {
  router.push('/parse/new')
}

function handleSearch() {
  ElMessage.info('全局搜索功能开发中')
}

function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    void handleLogout()
  }
}

async function handleLogout() {
  await authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <span class="header-title">{{ pageTitle }}</span>
    <div class="header-right">
      <el-input
        class="header-search"
        placeholder="搜索文档、项目、任务..."
        :prefix-icon="Search"
        clearable
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" :icon="Plus" round @click="goParse">
        新建解析
      </el-button>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-trigger">
          <el-avatar :size="34" class="user-avatar">{{ avatarText }}</el-avatar>
          <span class="user-name">{{ userName }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-search {
  width: 240px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-primary-deep)
  );
  color: #fff;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: var(--color-text);
}
</style>
