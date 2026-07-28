import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(getToken())
  const userInfo = ref<authApi.UserInfo | null>(getUser<authApi.UserInfo>())

  const isLoggedIn = computed(() => !!token.value)

  async function login(params: authApi.LoginParams) {
    const res = await authApi.login(params)
    token.value = res.token
    userInfo.value = res.user
    setToken(res.token)
    setUser(res.user)
    return res
  }

  async function register(params: authApi.RegisterParams) {
    const res = await authApi.register(params)
    token.value = res.token
    userInfo.value = res.user
    setToken(res.token)
    setUser(res.user)
    return res
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUser()
  }

  return { token, userInfo, isLoggedIn, login, register, logout }
})
