import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import { isSessionExpired } from '@/api/errors'
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

  // 登录态不能用「本地有 access token」代表：鉴权是 Bearer + Cookie 双轨，
  // 仅 Cookie 有效时 /users/me 会成功但本地没有 Bearer，用 token 判断会把
  // 已登录用户误判为未登录。以「拿到过用户信息」为准更贴合实际会话状态。
  const isLoggedIn = computed(() => !!userInfo.value)

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
        // 仅在请求层明确判定会话失效（refresh 失败或重试后仍 401）时清理本地态；
        // 5xx、网络抖动等场景保留本地状态，交由请求层提示用户。
        if (isSessionExpired(error)) {
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
    clearSession,
    logout,
  }
})
