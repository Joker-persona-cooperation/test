import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('@/views/auth/Login.vue') },
    { path: '/register', component: () => import('@/views/auth/Register.vue') },
    {
      path: '/',
      component: () => import('@/layouts/WorkspaceLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardHomeView.vue'),
          meta: {
            title: '工作台总览',
            description:
              '查看最近解析、今日提醒、重点项目和当前最值得优先推进的业务动作。',
            statusLabel: '演示数据模式',
          },
        },
        {
          path: 'parse/new',
          name: 'parse-create',
          component: () =>
            import('@/views/workspace/WorkspacePlaceholderView.vue'),
          meta: {
            title: '新建解析',
            description:
              '这里将承接上传 PDF、粘贴文本、发起解析任务与状态轮询的完整入口。',
            statusLabel: '待接入 documents + parse-jobs',
            suggestedActions: [
              '支持 PDF 上传与纯文本粘贴双模式录入。',
              '提交后立刻创建 parse job，并在前端轮询任务状态。',
              '任务完成后自动跳转到解析结果详情页。',
            ],
            endpointGroups: [
              'POST /api/v1/documents',
              'POST /api/v1/documents/text',
              'POST /api/v1/parse-jobs',
              'GET /api/v1/parse-jobs/{jobId}',
            ],
          },
        },
        {
          path: 'projects',
          name: 'projects',
          component: () =>
            import('@/views/workspace/WorkspacePlaceholderView.vue'),
          meta: {
            title: '项目管理',
            description:
              '这里将展示项目列表、项目详情、任务状态和项目归档管理。',
            statusLabel: '待接入 projects + tasks',
            suggestedActions: [
              '展示项目列表与项目状态筛选。',
              '进入项目详情后展示任务泳道和任务进度。',
              '支持从解析结果直接保存为项目。',
            ],
            endpointGroups: [
              'POST /api/v1/projects',
              'GET /api/v1/projects',
              'GET /api/v1/projects/{projectId}',
              'GET /api/v1/projects/{projectId}/tasks',
            ],
          },
        },
        {
          path: 'history',
          name: 'history',
          component: () =>
            import('@/views/workspace/WorkspacePlaceholderView.vue'),
          meta: {
            title: '历史记录',
            description:
              '这里将集中展示历史解析记录、历史项目与可回溯的任务数据。',
            statusLabel: '待接入 history',
            suggestedActions: [
              '查看全部历史解析记录并快速回跳详情页。',
              '区分已生成项目与未生成项目的历史结果。',
              '提供历史项目快照与任务只读视图。',
            ],
            endpointGroups: [
              'GET /api/v1/history/projects',
              'GET /api/v1/history/projects/{projectId}',
              'GET /api/v1/history/projects/{projectId}/tasks',
              'GET /api/v1/history/parse-results',
            ],
          },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () =>
            import('@/views/workspace/WorkspacePlaceholderView.vue'),
          meta: {
            title: '个人中心',
            description:
              '这里将承接账号信息、个人偏好、安全设置与后续个人工作偏好配置。',
            statusLabel: '待完善 account settings',
            suggestedActions: [
              '展示当前用户基础资料与邮箱信息。',
              '后续支持修改昵称、头像与偏好设置。',
              '补充账号安全与退出设备管理能力。',
            ],
            endpointGroups: ['GET /api/v1/users/me'],
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

setupGuards(router)

export default router
