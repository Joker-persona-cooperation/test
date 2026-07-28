<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)
const form = reactive({
  email: 'zmk@example.com',
  password: '',
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon-lg">T</div>
        <h1>TaskPilot</h1>
        <p>把要求文档变成能执行的任务清单</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少8位）"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            style="width: 100%; height: 44px; font-size: 15px"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
      <div class="auth-back">
        <router-link to="/">&larr; 返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5ff 0%, #f2f6fa 50%, #ffffff 100%);
  padding: 40px 20px;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(22, 50, 75, 0.1);
  padding: 40px 36px;
}
.auth-logo {
  text-align: center;
  margin-bottom: 28px;
}
.auth-logo .logo-icon-lg {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #38a5ff, #1f7fd0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 12px;
}
.auth-logo h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #16324b;
}
.auth-logo p {
  font-size: 14px;
  color: #58748f;
  margin: 0;
}
.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #58748f;
}
.auth-back {
  margin-top: 24px;
  text-align: center;
}
.auth-back a {
  font-size: 13px;
  color: #58748f;
  text-decoration: none;
}
.auth-back a:hover {
  color: #1f7fd0;
}
</style>
