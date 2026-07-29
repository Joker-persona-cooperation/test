<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="brand">
        <span class="brand-logo">T</span>
        <span class="brand-name">TaskPilot</span>
      </div>
      <div class="header-actions">
        <span v-if="authStore.userInfo" class="user-info">
          {{ authStore.userInfo.nickname }}
        </span>
        <el-button type="primary" plain @click="handleLogout"
          >退出登录</el-button
        >
      </div>
    </header>

    <main class="dashboard-body">
      <section class="welcome-card">
        <h2>欢迎使用 TaskPilot</h2>
        <p v-if="authStore.userInfo" class="welcome-tip">
          你好，{{ authStore.userInfo.nickname }}（{{
            authStore.userInfo.email
          }}）
        </p>
        <p class="welcome-tip">
          这里是工作台首页，后续将提供文档上传、AI 解析与项目任务管理入口。
        </p>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.dashboard-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(
        135deg,
        var(--color-primary),
        var(--color-primary-deep)
      );
      color: #fff;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      font-size: 14px;
      color: var(--color-text-soft);
    }
  }
}

.dashboard-body {
  flex: 1;
  padding: 32px 24px;
}

.welcome-card {
  max-width: 720px;
  margin: 0 auto;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 32px;

  h2 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text);
  }

  .welcome-tip {
    margin: 6px 0;
    font-size: 14px;
    color: var(--color-text-soft);
    line-height: 1.7;
  }
}
</style>
