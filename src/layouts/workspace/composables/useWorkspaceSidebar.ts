import { readonly, ref, watch } from 'vue'

const COLLAPSED_KEY = 'taskpilot_sidebar_collapsed'

// 折叠态在模块间共享且需要跨刷新保留，因此提到模块级单例，
// 而不是每个组件各存一份 ref。
const collapsed = ref(localStorage.getItem(COLLAPSED_KEY) === '1')
const mobileNavOpen = ref(false)

watch(collapsed, (value) => {
  localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
})

export function useWorkspaceSidebar() {
  return {
    collapsed: readonly(collapsed),
    mobileNavOpen,
    toggleCollapsed() {
      collapsed.value = !collapsed.value
    },
    openMobileNav() {
      mobileNavOpen.value = true
    },
    closeMobileNav() {
      mobileNavOpen.value = false
    },
  }
}
