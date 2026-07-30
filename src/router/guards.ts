import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { APP_NAME } from '@/constants/app'

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.bootstrapped || auth.bootstrapping) {
      await auth.bootstrapSession()
    }

    const loggedIn = auth.isLoggedIn
    // 公开页由路由 meta 声明，新增公开页不必再回来改守卫里的路径清单
    const isPublic = to.meta.public === true
    const isAuthEntry = to.name === 'login' || to.name === 'register'

    // 未登录访问受保护页面 -> 跳登录，并带上 redirect 以便登录后回跳
    if (!loggedIn && !isPublic) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    // 已登录还想去登录/注册页 -> 直接进工作台
    if (loggedIn && isAuthEntry) {
      return { name: 'dashboard' }
    }
    return true
  })

  // 标题跟随路由：浏览器历史与多标签场景下可辨识当前所在模块
  router.afterEach((to) => {
    const title = to.meta.title
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  })
}
