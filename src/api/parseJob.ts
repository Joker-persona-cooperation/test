// 解析任务相关接口，对接后端 /api/v1/parse-jobs
import { http } from './client'

// 解析任务状态：待处理 / 处理中 / 成功 / 失败
export type ParseJobStatus = 'pending' | 'processing' | 'success' | 'failed'

export interface CreateParseJobParams {
  document_id: number
}

export interface ParseJob {
  id: number
  document_id: number
  job_type: 'ai_parse'
  status: ParseJobStatus
  retry_count: number
  // 失败时后端返回的失败原因
  error_message?: string
  started_at?: string
  finished_at?: string
  created_at: string
  updated_at: string
}

// 解析结果中拆解出的单个任务
export interface ParseTask {
  title: string
  description: string | null
  // 优先级：high / medium / low
  priority?: 'high' | 'medium' | 'low'
  // 任务截止时间
  deadline: string | null
}

// 解析结果结构：对应文档拆解后的目标/截止时间/交付物/要求/风险/任务
export interface ParseResult {
  id: number
  parse_job_id: number
  document_id: number
  title: string
  summary: string
  // 截止时间（ISO 字符串）
  deadline: string | null
  // 交付物列表
  deliverables: string[]
  // 关键要求列表
  key_requirements: string[]
  // 风险提醒列表
  risk_warnings: string[]
  // 拆解出的任务清单
  generated_tasks: ParseTask[]
  // 是否已确认（第五步确认结果用）
  is_confirmed: boolean
  version: number
  ai_model?: string
  created_at: string
  updated_at: string
}

// 第二步：创建解析任务，拿到 jobId
export function createParseJob(
  params: CreateParseJobParams,
): Promise<ParseJob> {
  return http.post<ParseJob>('/parse-jobs', params)
}

// 第三步：轮询解析任务状态
export function getParseJob(jobId: number): Promise<ParseJob> {
  return http.get<ParseJob>(`/parse-jobs/${jobId}`)
}

export function retryParseJob(jobId: number): Promise<ParseJob> {
  return http.post<ParseJob>(`/parse-jobs/${jobId}/retry`)
}

// 第三步/第四步：任务成功后获取解析结果
export function getParseJobResult(jobId: number): Promise<ParseResult> {
  return http.get<ParseResult>(`/parse-jobs/${jobId}/result`)
}
