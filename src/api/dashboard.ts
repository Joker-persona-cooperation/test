// 工作台聚合数据的类型契约与接口封装。
//
// 后端响应固定使用 snake_case，而工作台视图类型使用 camelCase
// （见 docs/api-contract.md 第 7 节），因此本文件在 API 边界处做一次
// 明确的 DTO → ViewModel 映射，视图组件不感知后端字段命名。

import { http } from './client'
import type { ParseResult } from './parseJob'
import type { DocumentSource, ParseJobStatus } from '@/constants/parseStatus'

// ---------- 后端 DTO（snake_case，与 /api/v1/dashboard/* 响应一一对应） ----------

/** GET /dashboard/stats 响应 */
export interface DashboardStatsDto {
  documents: number
  parse_jobs: number
  active_projects: number
  open_tasks: number
}

/** GET /dashboard/reminders 响应中的单个提醒项 */
export interface DashboardReminderDto {
  id: number
  project_id: number
  title: string
  project: string
  deadline: string
  days_left: number
}

/** GET /dashboard/reminders 响应 */
export interface DashboardRemindersDto {
  items: DashboardReminderDto[]
}

// ---------- ViewModel（camelCase，视图专用） ----------

/** 概览指标卡的数值来源 */
export interface DashboardStats {
  documents: number
  parseJobs: number
  activeProjects: number
  openTasks: number
}

/** 「今日提醒」列表项 */
export interface DashboardReminder {
  id: number
  project_id: number
  title: string
  project: string
  deadline: string
  daysLeft: number
}

/** 「最近解析记录」列表项 */
export interface DashboardParseRecord {
  id: number
  title: string
  source?: DocumentSource
  status?: ParseJobStatus
  createdAt: string
}

// ---------- DTO → ViewModel 映射（在 API 边界完成） ----------

export function mapDashboardStats(dto: DashboardStatsDto): DashboardStats {
  return {
    documents: dto.documents,
    parseJobs: dto.parse_jobs,
    activeProjects: dto.active_projects,
    openTasks: dto.open_tasks,
  }
}

export function mapDashboardReminder(
  dto: DashboardReminderDto,
): DashboardReminder {
  return {
    id: dto.id,
    project_id: dto.project_id,
    title: dto.title,
    project: dto.project,
    deadline: dto.deadline,
    daysLeft: dto.days_left,
  }
}

// 「最近解析记录」复用 /history/parse-results 的分页解析结果。
// ParseResult 契约中不携带文档来源与解析任务状态，故 source / status 置为 undefined，
// 表格中对应列以占位符展示。
export function mapParseRecordToDashboard(
  dto: ParseResult,
): DashboardParseRecord {
  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.created_at.replace('T', ' ').slice(0, 16),
  }
}

// ---------- 请求封装 ----------

export function getDashboardStats(): Promise<DashboardStats> {
  return http.get<DashboardStatsDto>('/dashboard/stats').then(mapDashboardStats)
}

export function getDashboardReminders(): Promise<DashboardReminder[]> {
  return http
    .get<DashboardRemindersDto>('/dashboard/reminders')
    .then((dto) => dto.items.map(mapDashboardReminder))
}
