import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/auth/Login.vue') },
    {
      path: '/register',
      component: () => import('@/views/auth/Register.vue'),
    },
    {
      // 受保护页面统一挂载在 AppLayout 下，共享侧边栏/顶部栏/页签
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'parse/new',
          component: () => import('@/views/parse/ParseNew.vue'),
          meta: { title: '新建解析' },
        },
        {
          path: 'parse/:jobId/processing',
          component: () => import('@/views/parse/ParseProcessing.vue'),
          meta: { title: '解析处理中' },
        },
        {
          path: 'parse/:jobId/result',
          component: () => import('@/views/parse/ParseResult.vue'),
          meta: { title: '解析结果' },
        },
        {
          path: 'projects',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: '项目管理' },
        },
        {
          path: 'history',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: '历史记录' },
        },
        {
          path: 'profile',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: '个人中心' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

setupGuards(router)

export default router
