<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)
const form = reactive({
  nickname: '',
  email: '',
  password: '',
})

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 64, message: '昵称长度1-64位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.register({
      nickname: form.nickname,
      email: form.email,
      password: form.password,
    })
    ElMessage.success('注册成功')
    router.push('/dashboard')
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
        <h1>注册 TaskPilot</h1>
        <p>创建账号，开始拆解你的任务文档</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
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
            placeholder="请设置密码（至少8位）"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            class="auth-submit"
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        已有账号？<router-link to="/login">返回登录</router-link>
      </div>
      <div class="auth-back">
        <router-link to="/">&larr; 返回首页</router-link>
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
