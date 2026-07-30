import {
  Clock,
  FolderOpened,
  HomeFilled,
  Upload,
  User,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

export type WorkspaceNavKey =
  'dashboard' | 'parse-create' | 'projects' | 'history' | 'profile'

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
    key: 'parse-create',
    label: '新建解析',
    description: '上传文档或粘贴文本，发起新的解析任务。',
    path: '/parse/new',
    icon: Upload,
  },
  {
    key: 'projects',
    label: '项目管理',
    description: '浏览项目列表、查看任务进度与项目状态。',
    path: '/projects',
    icon: FolderOpened,
  },
  {
    key: 'history',
    label: '历史记录',
    description: '查看历史解析记录与历史项目快照。',
    path: '/history',
    icon: Clock,
  },
  {
    key: 'profile',
    label: '个人中心',
    description: '管理个人资料、偏好与账号安全设置。',
    path: '/profile',
    icon: User,
  },
]

export function isWorkspaceNavActive(currentPath: string, itemPath: string) {
  if (itemPath === '/dashboard') {
    return currentPath === itemPath
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export function findWorkspaceNavItem(currentPath: string) {
  return workspaceNavItems.find((item) =>
    isWorkspaceNavActive(currentPath, item.path),
  )
}
