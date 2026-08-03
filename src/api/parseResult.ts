// 解析结果确认接口，对接后端 /api/v1/parse-results
import { http } from './client'
import type { ParseResult } from './parseJob'

// 第五步：确认解析结果（标记用户已认可，后续可保存为项目）
export function confirmParseResult(resultId: number): Promise<ParseResult> {
  return http.post<ParseResult>(`/parse-results/${resultId}/confirm`)
}
