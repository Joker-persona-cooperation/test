import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.scss'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setSessionExpiredHandler } from './api/client'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore(pinia)

// 会话失效的善后集中在这里：请求层只抛 SessionExpiredError，由 store 清本地态、
// router 负责跳转。用 router.push 而非整页跳转，才能带上 redirect 让用户登录后
// 回到原来那一页；并发失效时 router 自身会吞掉重复导航。
setSessionExpiredHandler(() => {
  authStore.clearSession()

  const current = router.currentRoute.value
  if (current.meta.public === true) return

  void router.push({
    name: 'login',
    query: { redirect: current.fullPath },
  })
})

// 启动阶段先预热一次会话探测，路由守卫会在需要时等待它完成。
void authStore.bootstrapSession()

app.use(router)
app.mount('#app')
