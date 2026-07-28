import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import NotFound from '@/views/NotFound.vue'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/dashboard', component: DashboardView },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})

setupGuards(router)

export default router
