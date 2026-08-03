// 项目相关接口，对接后端 /api/v1/projects
//
// 任务类型与任务读写操作已统一收口在 src/api/task.ts：
// 项目侧只保留项目自身的 CRUD，createProject 返回的 tasks 复用 task 模块的类型。
import { http } from './client'
import type { Task } from './task'

export interface CreateProjectParams {
  parse_result_id: number
  name: string
}

export interface Project {
  id: number
  source_document_id: number
  parse_result_id: number
  name: string
  description: string | null
  deadline: string | null
  status: 'active' | 'archived' | 'deleted'
  version: number
  created_at: string
  updated_at: string
}

export interface CreateProjectResponse {
  project: Project
  tasks: Task[]
}

export interface ProjectListResponse {
  items: Project[]
  page: number
  page_size: number
  total: number
}

// 任务类型随用随导，方便旧调用方继续从 @/api/project 取到 Task
export type { Task } from './task'

// 第五步：将已确认的解析结果保存为项目
export function createProject(
  params: CreateProjectParams,
): Promise<CreateProjectResponse> {
  return http.post<CreateProjectResponse>('/projects', params)
}

export function getProjects(status: 'active' | 'archived' = 'active') {
  return http.get<ProjectListResponse>('/projects', { params: { status } })
}

export function getProject(projectId: number) {
  return http.get<Project>(`/projects/${projectId}`)
}
