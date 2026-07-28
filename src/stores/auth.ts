import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  const isLoggedIn = computed(() => !!token.value)

  function applySession(res: authApi.AuthResult) {
    token.value = res.access_token
    userInfo.value = res.user
    setToken(res.access_token)
    setUser(res.user)
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

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 登出接口失败时仍需清理本地会话
    } finally {
      token.value = ''
      userInfo.value = null
      removeToken()
      removeUser()
    }
  }

  return { token, userInfo, isLoggedIn, login, register, fetchProfile, logout }
})
