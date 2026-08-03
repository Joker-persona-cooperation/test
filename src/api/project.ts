// 项目相关接口，对接后端 /api/v1/projects
import { http } from './client'

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

export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  project_id: number
  source_parse_result_id: number | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  deadline: string | null
  sort_order: number
  source_type: 'ai' | 'manual'
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

export interface TaskListResponse {
  items: Task[]
}

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

export function getProjectTasks(projectId: number) {
  return http.get<TaskListResponse>(`/projects/${projectId}/tasks`)
}

export function updateTaskStatus(taskId: number, status: TaskStatus) {
  return http.patch<Task>(`/tasks/${taskId}/status`, { status })
}
