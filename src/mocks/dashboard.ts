import type {
  DashboardParseRecord,
  DashboardReminder,
  DashboardStats,
} from '@/api/dashboard'

// 工作台演示数据。等 documents / parse-jobs / projects 接口接入后整个文件即可删除，
// 演示数据集中在此处是为了不让假数据散落进视图组件。
// 注意：类型定义在 api/dashboard.ts，删除本文件时不要连带删掉那些类型。

export const mockStats: DashboardStats = {
  documents: 12,
  parseJobs: 8,
  activeProjects: 5,
  openTasks: 23,
}

export const mockParseRecords: DashboardParseRecord[] = [
  {
    id: 1,
    title: '2026 年大学生创新创业大赛报名通知',
    source: 'pdf',
    status: 'success',
    createdAt: '2026-07-24 14:32',
  },
  {
    id: 2,
    title: '软件工程课程设计要求',
    source: 'text',
    status: 'success',
    createdAt: '2026-07-23 20:15',
  },
  {
    id: 3,
    title: '毕业设计开题报告模板说明',
    source: 'pdf',
    status: 'processing',
    createdAt: '2026-07-23 16:08',
  },
  {
    id: 4,
    title: '暑期实习项目需求文档',
    source: 'text',
    status: 'failed',
    createdAt: '2026-07-22 10:20',
  },
]

export const mockReminders: DashboardReminder[] = [
  {
    id: 1,
    title: '提交项目说明书',
    project: '创新创业比赛报名',
    deadline: '2026-08-01',
    daysLeft: 2,
  },
  {
    id: 2,
    title: '录制演示视频',
    project: '创新创业比赛报名',
    deadline: '2026-08-03',
    daysLeft: 4,
  },
  {
    id: 3,
    title: '完成课程设计报告',
    project: '软件工程课程设计',
    deadline: '2026-08-05',
    daysLeft: 6,
  },
]
