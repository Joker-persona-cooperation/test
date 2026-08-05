// 历史记录相关接口，对接后端 /api/v1/history/*
//
// 项目与任务复用主域模块的 Project / Task 类型：历史接口的字段命名与视图
// 一致，无需归一化（见 docs/api-contract.md 第 7 节）。历史解析结果分页
// 复用 ParseResultHistoryResponse 结构，此处额外支持 page 参数供分页。
import { http } from './client'
import type { Project, ProjectListResponse } from './project'
import type { TaskListResponse } from './task'
import type { ParseResultHistoryResponse } from './parseResult'

// 分页全状态项目列表（active / archived / deleted 均返回）
export function getHistoryProjects(
  page = 1,
  pageSize = 20,
  status?: Project['status'],
): Promise<ProjectListResponse> {
  return http.get<ProjectListResponse>('/history/projects', {
    params: { page, page_size: pageSize, status },
  })
}

// 历史项目详情
export function getHistoryProject(projectId: number): Promise<Project> {
  return http.get<Project>(`/history/projects/${projectId}`)
}

// 历史项目任务（只读，按 sort_order 升序返回）
export function getHistoryProjectTasks(
  projectId: number,
): Promise<TaskListResponse> {
  return http.get<TaskListResponse>(`/history/projects/${projectId}/tasks`)
}

// 分页解析结果历史（与 parseResult.ts 的 getParseResultHistory 同源，
// 该封装额外暴露 page 参数，供历史页分页使用）
export function getHistoryParseResults(
  page = 1,
  pageSize = 20,
): Promise<ParseResultHistoryResponse> {
  return http.get<ParseResultHistoryResponse>('/history/parse-results', {
    params: { page, page_size: pageSize },
  })
}
