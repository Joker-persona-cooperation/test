import type { TagProps } from 'element-plus'

// 项目状态的权威定义集中在 constants 层：api/ 与 views/ 都从这里取类型与文案，
// 避免各页面自行硬编码 status 的中文与颜色映射（如 ProjectListView / ProjectDetailView 中的三目判断）。
// 详见 docs/error-codes-and-enums.md 第 2.4 节。
export type ProjectStatus = 'active' | 'archived' | 'deleted'

type TagType = TagProps['type']

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: '进行中',
  archived: '已归档',
  deleted: '已删除',
}

export const PROJECT_STATUS_TAG: Record<ProjectStatus, TagType> = {
  active: 'success',
  archived: 'info',
  deleted: 'danger',
}
