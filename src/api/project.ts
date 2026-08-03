// 项目相关接口，对接后端 /api/v1/projects
import { http } from './client'

export interface CreateProjectParams {
  parse_result_id: number
  title: string
  deadline?: string
}

export interface Project {
  id: number
  title: string
  deadline?: string
  // 项目状态：active / archived
  status?: string
  created_at: string
}

// 第五步：将已确认的解析结果保存为项目
export function createProject(params: CreateProjectParams): Promise<Project> {
  return http.post<Project>('/projects', params)
}
