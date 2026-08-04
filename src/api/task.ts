// 任务相关接口，对接后端 /api/v1/projects/:projectId/tasks 与 /api/v1/tasks/*
//
// 任务是项目的唯一真相源：source_type=ai 由保存项目时从解析快照展开，
// source_type=manual 由本模块的 createTask 手动新增。状态流转走 PATCH /status，
// 整体编辑走 PUT（带乐观锁 version），顺序调整走 POST /tasks/reorder。
import { http } from './client'
import type { TaskPriority, TaskStatus } from '@/constants/task'

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

export interface TaskListResponse {
  items: Task[]
}

export interface CreateTaskParams {
  title: string
  priority: TaskPriority
  description?: string | null
  deadline?: string | null
}

export interface UpdateTaskParams {
  // 乐观锁版本号：PUT 必须携带当前 version，并发改动会返回 409（code 10007）
  version: number
  title: string
  priority: TaskPriority
  description?: string | null
  deadline?: string | null
}

export interface ReorderTasksParams {
  project_id: number
  // 项目内全部任务 ID 的最新顺序，后端按数组下标重写 sort_order
  task_ids: number[]
}

// 查询项目下全部任务（后端按 sort_order 升序返回）
export function getProjectTasks(
  projectId: number,
  status?: TaskStatus,
): Promise<TaskListResponse> {
  return http.get<TaskListResponse>(`/projects/${projectId}/tasks`, {
    params: status ? { status } : undefined,
  })
}

// 项目内手动新增任务：source_type=manual，落库后 sort_order 追加到对应列末尾
export function createTask(
  projectId: number,
  params: CreateTaskParams,
): Promise<Task> {
  return http.post<Task>(`/projects/${projectId}/tasks`, params)
}

// 乐观锁编辑任务：409 时调用方应重新拉取最新 version 再提示用户重试
export function updateTask(
  taskId: number,
  params: UpdateTaskParams,
): Promise<Task> {
  return http.put<Task>(`/tasks/${taskId}`, params)
}

// 仅更新状态：用于看板列间快速流转，避免触发整条 PUT 的乐观锁冲突
export function updateTaskStatus(
  taskId: number,
  status: TaskStatus,
): Promise<Task> {
  return http.patch<Task>(`/tasks/${taskId}/status`, { status })
}

// 物理删除任务（后端硬删，区别于项目的逻辑删除）
export function deleteTask(taskId: number): Promise<void> {
  return http.delete<void>(`/tasks/${taskId}`)
}

// 完整有序集合事务重排：调用方需传入项目内全部任务的最新顺序，
// 后端整体重写 sort_order，避免部分更新造成顺序空洞
export function reorderTasks(
  params: ReorderTasksParams,
): Promise<TaskListResponse> {
  return http.post<TaskListResponse>('/tasks/reorder', params)
}
