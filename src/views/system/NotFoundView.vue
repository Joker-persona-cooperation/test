<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found-card">
      <div class="code">404</div>
      <p class="desc">页面不存在或已被移除</p>
      <el-button type="primary" @click="router.push({ name: 'dashboard' })">
        返回工作台
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 20px;
}

.not-found-card {
  text-align: center;

  .code {
    font-size: 72px;
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1;
  }

  .desc {
    margin: 12px 0 24px;
    font-size: 15px;
    color: var(--color-text-soft);
  }
}
</style>
