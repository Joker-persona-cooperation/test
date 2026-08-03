// 文档相关接口，对接后端 /api/v1/documents
import { http } from './client'

// 文档来源类型：纯文本 / PDF 文件
export type DocumentSource = 'text' | 'pdf'

export interface TextDocumentParams {
  // 标题可选，缺省时由后端按内容截断生成
  title?: string
  // 正文内容，必填
  content: string
}

export interface Document {
  id: number
  title: string
  content: string
  source_type: DocumentSource
  created_at: string
}

// 提交纯文本文档：第一步录入入口
export function createTextDocument(
  params: TextDocumentParams,
): Promise<Document> {
  return http.post<Document>('/documents/text', params)
}
