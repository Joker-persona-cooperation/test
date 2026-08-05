import { Clock, FolderOpened, HomeFilled } from '@element-plus/icons-vue'
import type { Component } from 'vue'

export type WorkspaceNavKey =
  'dashboard' | 'projects' | 'parse-records' | 'profile'

export interface WorkspaceNavItem {
  key: WorkspaceNavKey
  label: string
  /** 折叠态 title 提示与移动端抽屉说明共用 */
  description: string
  path: string
  icon: Component
}

// 导航是「侧边栏 + 移动端抽屉 + 页面头」的唯一数据源，图标一并收在这里，
// 避免各组件再各自维护一份 key -> icon 映射。
export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看近期解析、提醒与项目整体动态。',
    path: '/dashboard',
    icon: HomeFilled,
  },
  {
    key: 'projects',
    label: '项目管理',
    description: '浏览项目列表、查看任务进度与项目状态。',
    path: '/projects',
    icon: FolderOpened,
  },
  {
    key: 'parse-records',
    label: '解析记录',
    description: '查看历史解析结果与关联项目记录。',
    path: '/parses',
    icon: Clock,
  },
]

export function isWorkspaceNavActive(
  currentNavKey: unknown,
  itemKey: WorkspaceNavKey,
) {
  return currentNavKey === itemKey
}

export function findWorkspaceNavItem(currentNavKey: unknown) {
  return workspaceNavItems.find((item) => item.key === currentNavKey)
}
