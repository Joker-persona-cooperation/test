// 文档相关接口，对接后端 /api/v1/documents
import { http } from './client'

// 文档来源类型：纯文本 / PDF 文件
export type DocumentSource = 'text' | 'pdf'

export interface TextDocumentParams {
  // 标题必填，后端限制最多 255 个 Unicode 字符
  title: string
  // 正文内容，必填
  text: string
}

export interface Document {
  id: number
  source_type: DocumentSource
  title?: string
  file_name?: string
  file_url?: string
  page_count?: number
  file_size?: number
  status: 'uploaded' | 'ready' | 'failed'
  content?: string
  created_at: string
  updated_at: string
}

// 提交纯文本文档：第一步录入入口
export function createTextDocument(
  params: TextDocumentParams,
): Promise<Document> {
  return http.post<Document>('/documents/text', params)
}

// 上传 PDF 文档：multipart 表单，file 必填，title 可选
export function createPdfDocument(
  params: { file: File; title?: string },
): Promise<Document> {
  const formData = new FormData()
  formData.append('file', params.file)
  if (params.title) formData.append('title', params.title)
  return http.post<Document>('/documents/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getDocument(documentId: number): Promise<Document> {
  return http.get<Document>(`/documents/${documentId}`)
}
