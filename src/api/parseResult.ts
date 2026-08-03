// 解析结果确认接口，对接后端 /api/v1/parse-results
import { http } from './client'
import type { ParseResult } from './parseJob'

export interface UpdateParseResultParams {
  version: number
  title: string
  summary: string
  deadline: string | null
  deliverables: string[]
  key_requirements: string[]
  risk_warnings: string[]
  generated_tasks: ParseResult['generated_tasks']
}

export function updateParseResult(
  resultId: number,
  params: UpdateParseResultParams,
): Promise<ParseResult> {
  return http.put<ParseResult>(`/parse-results/${resultId}`, params)
}

// 第五步：确认解析结果（标记用户已认可，后续可保存为项目）
export function confirmParseResult(resultId: number): Promise<ParseResult> {
  return http.post<ParseResult>(`/parse-results/${resultId}/confirm`)
}
