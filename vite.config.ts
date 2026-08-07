import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
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
export default defineConfig({
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
      // 开发态必须联调远端 dev API，但浏览器侧保持 /api 同源请求，
      // 避免 refresh/csrf Cookie 落入跨站场景而导致无感刷新失效。
      '/api': {
        target: 'https://dev.taskpilot.1kuansi.cn',
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
})
