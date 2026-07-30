<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="workspace-header">
    <div class="workspace-header__brand">
      <span class="workspace-header__logo">T</span>
      <div>
        <p class="workspace-header__name">TaskPilot</p>
        <p class="workspace-header__tagline">任务型文档拆解工作台</p>
      </div>
    </div>
    <div class="workspace-header__actions">
      <div v-if="authStore.userInfo" class="workspace-header__user">
        <strong>{{ authStore.userInfo.nickname }}</strong>
        <span>{{ authStore.userInfo.email }}</span>
      </div>
      <el-button type="primary" plain @click="handleLogout">退出登录</el-button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.workspace-header {
  min-height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 4px 20px rgba(22, 50, 75, 0.04);

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__logo {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary-deep)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
  }

  &__name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
  }

  &__tagline {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--color-text-soft);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__user {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    strong {
      font-size: 14px;
      color: var(--color-text);
      line-height: 1.2;
    }

    span {
      font-size: 12px;
      color: var(--color-text-soft);
      line-height: 1.2;
    }
  }
}

@media (max-width: 768px) {
  .workspace-header {
    align-items: flex-start;
    flex-direction: column;

    &__actions {
      width: 100%;
      justify-content: space-between;
    }

    &__user {
      align-items: flex-start;
    }
  }
}
</style>
