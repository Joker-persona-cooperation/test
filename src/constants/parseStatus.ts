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

// 文档状态映射。文档第 2.1 节指出 documents.status 此前无前端映射，
// 列表/详情/工作台展示时统一从这里取，避免各页面拼装中文与颜色。
export type DocumentStatus = 'uploaded' | 'ready' | 'failed'

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  uploaded: '已上传',
  ready: '就绪',
  failed: '失败',
}

export const DOCUMENT_STATUS_TAG: Record<DocumentStatus, TagType> = {
  uploaded: 'info',
  ready: 'success',
  failed: 'danger',
}

// 解析结果确认态映射。文档第 2.3 节指出 is_confirmed 此前无前端映射，
// ParseResult 等页面目前硬编码「已确认/待确认」，统一收口到这里。
export const CONFIRM_LABEL: { true: string; false: string } = {
  true: '已确认',
  false: '待确认',
}

export const CONFIRM_TAG: { true: TagType; false: TagType } = {
  true: 'success',
  false: 'warning',
}
