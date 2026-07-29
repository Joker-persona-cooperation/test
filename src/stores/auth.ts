import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isAxiosError } from 'axios'
import * as authApi from '@/api/auth'
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(getToken())
  const userInfo = ref<authApi.UserProfile | null>(
    getUser<authApi.UserProfile>(),
  )
  const bootstrapped = ref(false)
  const bootstrapping = ref(false)
  let bootstrapPromise: Promise<void> | null = null

  const isLoggedIn = computed(() => !!token.value)

  function shouldClearSessionOnBootstrap(error: unknown): boolean {
    if (!isAxiosError(error)) return false
    const status = error.response?.status
    return status === 401
  }

  function applySession(res: authApi.AuthResult) {
    token.value = res.access_token
    userInfo.value = res.user
    setToken(res.access_token)
    setUser(res.user)
  }

  function clearSession() {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUser()
  }

  async function login(params: authApi.LoginParams) {
    const res = await authApi.login(params)
    applySession(res)
    return res
  }

  async function register(params: authApi.RegisterParams) {
    const res = await authApi.register(params)
    applySession(res)
    return res
  }

  async function fetchProfile() {
    const user = await authApi.fetchProfile()
    userInfo.value = user
    setUser(user)
    return user
  }

  async function bootstrapSession() {
    if (bootstrapped.value) return
    if (bootstrapPromise) return bootstrapPromise

    bootstrapping.value = true
    bootstrapPromise = (async () => {
      try {
        // 统一从“获取当前用户”开始探测会话：
        // 1. 本地 Bearer 有效时直接成功
        // 2. 仅 Cookie 有效时由后端 Cookie 鉴权成功
        // 3. access 失效但 refresh 有效时由请求层自动 refresh 后重试成功
        await fetchProfile()
      } catch (error) {
        // 仅在服务端明确判定会话无效时清理本地态；
        // 5xx、网络抖动等场景保留本地状态，交由请求层提示用户。
        if (shouldClearSessionOnBootstrap(error)) {
          clearSession()
        }
      } finally {
        bootstrapping.value = false
        bootstrapped.value = true
        bootstrapPromise = null
      }
    })()

    return bootstrapPromise
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 登出接口失败时仍需清理本地会话
    } finally {
      clearSession()
    }
  }

  return {
    token,
    userInfo,
    bootstrapped,
    bootstrapping,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    bootstrapSession,
    logout,
  }
})
