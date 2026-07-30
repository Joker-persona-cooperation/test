import { computed, onUnmounted, ref } from 'vue'

function currentHour() {
  return new Date().getHours()
}

/**
 * 时段问候语。原实现在模块加载时只取一次小时数，长时间挂着页面会一直显示
 * “上午好”，这里按分钟刷新，跨时段时文案会自动更新。
 */
export function useGreeting() {
  const hour = ref(currentHour())
  const timer = window.setInterval(() => {
    hour.value = currentHour()
  }, 60_000)

  onUnmounted(() => window.clearInterval(timer))

  return computed(() => {
    if (hour.value < 6) return '夜深了'
    if (hour.value < 12) return '上午好'
    if (hour.value < 18) return '下午好'
    return '晚上好'
  })
}
