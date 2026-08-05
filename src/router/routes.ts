import type { RouteRecordRaw } from 'vue-router'

// 占位模块统一用同一个视图渲染，差异全部由 meta 描述，
// 后续某个模块真正落地时只需替换这里的 component。
const ModulePlaceholderView = () =>
  import('@/views/system/ModulePlaceholderView.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: '注册', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/workspace/WorkspaceLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '工作台',
          description:
            '查看最近解析、今日提醒、重点项目和当前最值得优先推进的业务动作。',
          statusLabel: '演示数据模式',
        },
      },
      {
        path: 'parse/new',
        name: 'parse-create',
        component: () => import('@/views/parse/ParseNew.vue'),
        meta: {
          title: '新建解析',
          description: '粘贴任务文档，由 AI 自动拆解任务目标与执行清单。',
        },
      },
      {
        path: 'parse/:jobId/processing',
        name: 'parse-processing',
        component: () => import('@/views/parse/ParseProcessing.vue'),
        meta: {
          title: '解析处理中',
          description: '查看文档解析任务的实时处理状态。',
        },
      },
      {
        path: 'parse/:jobId/result',
        name: 'parse-result',
        component: () => import('@/views/parse/ParseResult.vue'),
        meta: {
          title: '解析结果',
          description: '查看解析结果并将任务清单保存为项目。',
        },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/projects/ProjectListView.vue'),
        meta: {
          title: '项目管理',
          description: '浏览进行中或已归档项目，查看任务整体进度。',
        },
      },
      {
        path: 'projects/:projectId',
        name: 'project-detail',
        component: () => import('@/views/projects/ProjectDetailView.vue'),
        meta: {
          title: '项目任务',
          description: '查看项目任务并更新待办、进行中和已完成状态。',
        },
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@/views/history/HistoryView.vue'),
        meta: {
          title: '历史记录',
          description:
            '集中展示历史解析记录、历史项目与可回溯的任务数据。',
          statusLabel: '已接入 history',
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ModulePlaceholderView,
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
    name: 'not-found',
    component: () => import('@/views/system/NotFoundView.vue'),
    meta: { title: '页面不存在', public: true },
  },
]
