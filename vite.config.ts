import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const vendorChunkGroups = [
  {
    name: 'vue-ecosystem',
    test: /node_modules[\\/](?:@vue[\\/]|vue-router(?:[\\/]|$)|pinia(?:[\\/]|$))/,
    priority: 30,
  },
  {
    name: 'axios',
    test: /node_modules[\\/]axios(?:[\\/]|$)/,
    priority: 10,
  },
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 代理目标优先级：命令行环境变量 > 对应 mode 的 .env 文件 > 本地默认。
  // 切换后端环境无需改本文件：
  //   npm run dev:local   -> 本地 8888
  //   npm run dev:remote  -> 服务器 dev
  //   TASKPILOT_DEV_API_TARGET=https://xxx npm run dev  -> 临时覆盖
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget =
    process.env.TASKPILOT_DEV_API_TARGET ||
    env.TASKPILOT_DEV_API_TARGET ||
    'http://127.0.0.1:8888'

  return {
    plugins: [
      vue(),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        // 开发态必须联调后端 API，但浏览器侧保持 /api 同源请求，
        // 避免 refresh/csrf Cookie 落入跨站场景而导致无感刷新失效。
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: vendorChunkGroups,
          },
        },
      },
    },
  }
})
