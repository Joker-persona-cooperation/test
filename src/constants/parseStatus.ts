import type { TagProps } from 'element-plus'

export type ParseJobStatus = 'pending' | 'processing' | 'success' | 'failed'
export type DocumentSource = 'pdf' | 'text'

type TagType = TagProps['type']

// 解析状态与来源的文案、色彩映射集中在这里，
// 后续列表页、详情页、历史页共用同一套语义，避免各页面自行拼装。
export const PARSE_STATUS_LABEL: Record<ParseJobStatus, string> = {
  pending: '待处理',
  processing: '解析中',
  success: '已完成',
  failed: '失败',
}

export const PARSE_STATUS_TAG: Record<ParseJobStatus, TagType> = {
  pending: 'info',
  processing: 'warning',
  success: 'success',
  failed: 'danger',
}

export const DOCUMENT_SOURCE_LABEL: Record<DocumentSource, string> = {
  pdf: 'PDF',
  text: '文本',
}
