import type { TagProps } from 'element-plus'

// 任务枚举的权威定义集中在 constants 层：api/ 与 views/ 都从这里取类型与文案，
// 避免各页面自行硬编码 status / priority 的中文与颜色映射。
// 详见 docs/error-codes-and-enums.md 第 2.5 节。
export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskSource = 'ai' | 'manual'

type TagType = TagProps['type']

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
}

export const TASK_STATUS_TAG: Record<TaskStatus, TagType> = {
  todo: 'info',
  doing: 'warning',
  done: 'success',
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const TASK_PRIORITY_TAG: Record<TaskPriority, TagType> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
}

export const TASK_SOURCE_LABEL: Record<TaskSource, string> = {
  ai: 'AI 生成',
  manual: '手动',
}

// 看板列顺序：待办 → 进行中 → 已完成，集中维护避免列表页 / 详情页 / 历史页各写一份。
export const TASK_STATUS_COLUMNS: Array<{ status: TaskStatus; label: string }> =
  [
    { status: 'todo', label: '待办' },
    { status: 'doing', label: '进行中' },
    { status: 'done', label: '已完成' },
  ]

// 选项集合：派生自上面的 LABEL 映射，供 el-select / el-radio-group 直接 v-for 使用，
// 保证「文案」只有一处真相源，后端枚举变更时只需改 LABEL。
export const TASK_STATUS_OPTIONS: Array<{
  value: TaskStatus
  label: string
}> = (Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABEL[value],
}))

export const TASK_PRIORITY_OPTIONS: Array<{
  value: TaskPriority
  label: string
}> = (Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}))
