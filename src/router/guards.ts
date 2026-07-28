import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const publicPages = ['/login', '/register']

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    const loggedIn = auth.isLoggedIn

    // 未登录访问受保护页面 -> 跳登录，并带上 redirect 以便登录后回跳
    if (!loggedIn && !publicPages.includes(to.path)) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    // 已登录还想去登录/注册页 -> 直接进工作台
    if (loggedIn && publicPages.includes(to.path)) {
      return { path: '/dashboard' }
    }
    return true
  })
}
