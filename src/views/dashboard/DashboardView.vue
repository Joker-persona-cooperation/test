<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

// 工作台内容区：外壳(侧边栏/顶部栏/页签)已由 AppLayout 提供，
// 此处仅保留欢迎内容，后续再补充统计/记录/提醒等模块。
const authStore = useAuthStore()
</script>

<template>
  <div class="dashboard">
    <section class="welcome-card">
      <h2>欢迎使用 TaskPilot</h2>
      <p v-if="authStore.userInfo" class="welcome-tip">
        你好，{{ authStore.userInfo.nickname }}
      </p>
      <p class="welcome-tip">
        这里是工作台首页，后续将提供文档上传、AI 解析与项目任务管理入口。
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  max-width: 720px;
}

.welcome-card {
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
