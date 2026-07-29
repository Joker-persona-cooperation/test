<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getLastEmail, setLastEmail, clearLastEmail } from '@/utils/storage'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const remember = ref(true)
const form = reactive({
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
    form.email = last
    remember.value = true
  } else {
    remember.value = false
  }
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })
    // 登录成功后按选择保存/清除邮箱
    if (remember.value) {
      setLastEmail(form.email)
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
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary-soft) 0%,
    var(--color-bg) 50%,
    var(--color-surface) 100%
  );
  padding: 40px 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 40px 36px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 28px;

  .logo-icon-lg {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary-deep)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--color-text);
  }

  p {
    font-size: 14px;
    color: var(--color-text-soft);
    margin: 0;
  }
}

.remember-email {
  margin-bottom: 18px;
}

.auth-submit {
  width: 100%;
  height: 44px;
  font-size: 15px;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-soft);
}

.auth-back {
  margin-top: 24px;
  text-align: center;

  a {
    font-size: 13px;
    color: var(--color-text-soft);

    &:hover {
      color: var(--color-primary-deep);
    }
  }
}
</style>
