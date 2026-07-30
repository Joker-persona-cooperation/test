<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getLastEmail, setLastEmail, clearLastEmail } from '@/utils/storage'
import { APP_NAME, APP_SLOGAN } from '@/constants/app'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const remember = ref(true)
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

// 退出登录后保留邮箱：进入登录页时预填，免去重复输入邮箱
onMounted(() => {
  const last = getLastEmail()
  if (last) {
    loginForm.email = last
    remember.value = true
  } else {
    remember.value = false
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
    // 登录成功后按选择保存/清除邮箱
    if (remember.value) {
      setLastEmail(loginForm.email)
    } else {
      clearLastEmail()
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
        <el-form-item class="remember-email">
          <el-checkbox v-model="remember">记住邮箱</el-checkbox>
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
.remember-email {
  margin-bottom: 18px;
}
</style>
