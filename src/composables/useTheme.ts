// 主题切换组合式逻辑
// 点击即直接切换，不做扩散动画；偏好持久化到 localStorage
import { ref } from 'vue'

const THEME_KEY = 'taskpilot_theme'

// 模块级单例：跨组件共享同一份暗黑状态，初始值同步自 index.html 防闪烁脚本已写入的 class
const isDark = ref(document.documentElement.classList.contains('dark'))

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  } catch {
    // 隐私模式或存储不可用时静默忽略
  }
}

/**
 * 切换主题，立即生效。
 */
function toggle() {
  const next = !isDark.value
  isDark.value = next
  applyTheme(next)
}

export function useTheme() {
  return { isDark, toggle }
}
