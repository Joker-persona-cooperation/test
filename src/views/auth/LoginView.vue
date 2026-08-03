<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import {
  getSavedCredentials,
  setSavedCredentials,
  clearSavedCredentials,
} from '@/utils/storage'
import { APP_NAME, APP_SLOGAN } from '@/constants/app'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
// 记住密码默认开启，且不再提供开关按钮；登录凭据自动记住
const rememberPassword = ref(true)
const loginForm = reactive({
  email: '',
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

// 进入登录页时自动回填已保存的登录凭据
onMounted(() => {
  const saved = getSavedCredentials()
  if (saved) {
    loginForm.email = saved.email
    loginForm.password = saved.password
  }
})

const handleSubmit = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.login({
      email: loginForm.email,
      password: loginForm.password,
    })
    // 记住密码默认开启：成功后保存凭据，取消勾选则清除已保存凭据
    if (rememberPassword.value) {
      setSavedCredentials(loginForm.email, loginForm.password)
    } else {
      clearSavedCredentials()
    }
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch {
    // 请求层已统一提示错误，这里只负责结束提交流程
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-brand__logo" aria-hidden="true">T</div>
        <h1>{{ APP_NAME }}</h1>
        <p>{{ APP_SLOGAN }}</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码（至少8位）"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item class="remember-password">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            class="auth-submit"
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 页面骨架样式见 styles/auth.scss，此处只留登录页独有的部分
.remember-password {
  margin-bottom: 18px;
}
</style>
