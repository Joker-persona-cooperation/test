import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 切换模块时回到顶部，避免从长列表跳转后落在半屏位置
  scrollBehavior: () => ({ top: 0 }),
})

setupGuards(router)

export default router
