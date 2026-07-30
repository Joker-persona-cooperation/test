export interface WorkspaceNavItem {
  key: 'dashboard' | 'parse-create' | 'projects' | 'history' | 'profile'
  label: string
  shortLabel: string
  description: string
  path: string
}

export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    key: 'dashboard',
    label: '工作台总览',
    shortLabel: '总览',
    description: '查看近期解析、提醒与项目整体动态。',
    path: '/dashboard',
  },
  {
    key: 'parse-create',
    label: '新建解析',
    shortLabel: '新建解析',
    description: '上传文档或粘贴文本，发起新的解析任务。',
    path: '/parse/new',
  },
  {
    key: 'projects',
    label: '项目管理',
    shortLabel: '项目',
    description: '浏览项目列表、查看任务进度与项目状态。',
    path: '/projects',
  },
  {
    key: 'history',
    label: '历史记录',
    shortLabel: '历史',
    description: '查看历史解析记录与历史项目快照。',
    path: '/history',
  },
  {
    key: 'profile',
    label: '个人中心',
    shortLabel: '我的',
    description: '管理个人资料、偏好与账号安全设置。',
    path: '/profile',
  },
]

export function isWorkspaceNavActive(currentPath: string, itemPath: string) {
  if (itemPath === '/dashboard') {
    return currentPath === itemPath
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}
