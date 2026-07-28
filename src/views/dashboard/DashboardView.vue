<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-placeholder">
    <h2>工作台</h2>
    <p v-if="authStore.userInfo">
      欢迎，{{ authStore.userInfo.nickname }}（{{ authStore.userInfo.email }}）
    </p>
    <p>登录 / 注册成功后的占位页，后续会补充真实内容。</p>
    <el-button type="primary" @click="handleLogout">退出登录</el-button>
  </div>
</template>

<style scoped>
.dashboard-placeholder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #58748f;
}
</style>
