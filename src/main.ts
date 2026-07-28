import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/es/components/message/style/css'
import './styles/index.scss'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 启动阶段先预热一次会话探测，路由守卫会在需要时等待它完成。
void useAuthStore(pinia).bootstrapSession()

app.use(router)
app.mount('#app')
