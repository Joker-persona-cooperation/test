// 工作台聚合数据的类型契约。
//
// 这些类型原先定义在 mocks/dashboard.ts 里，但它们描述的是后端返回结构而非
// 测试夹具：mock 文件在接口接入后会删除，类型必须留下来。接口就绪时在本文件
// 补上请求函数即可，视图侧的类型引用不需要跟着改。
import type { DocumentSource, ParseJobStatus } from '@/constants/parseStatus'

/** 概览指标卡的数值来源 */
export interface DashboardStats {
  documents: number
  parseJobs: number
  activeProjects: number
  openTasks: number
}

/** 「最近解析记录」列表项 */
export interface DashboardParseRecord {
  id: number
  title: string
  source: DocumentSource
  status: ParseJobStatus
  createdAt: string
}

/** 「今日提醒」列表项 */
export interface DashboardReminder {
  id: number
  title: string
  project: string
  deadline: string
  daysLeft: number
}
