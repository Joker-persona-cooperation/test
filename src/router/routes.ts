import type { RouteRecordRaw } from 'vue-router'

// 页面标题、导航归属与顶栏动作统一由 meta 驱动。
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
          description: '查看最近解析、近期提醒和当前最值得优先推进的业务动作。',
          navKey: 'dashboard',
        },
      },
      {
        path: 'parse/new',
        name: 'parse-create',
        component: () => import('@/views/parse/ParseNew.vue'),
        meta: {
          title: '新建解析',
          description: '粘贴任务文档，由 AI 自动拆解任务目标与执行清单。',
          breadcrumb: [{ label: '工作台', name: 'dashboard' }, { label: '新建解析' }],
        },
      },
      {
        path: 'parse/:jobId/processing',
        name: 'parse-processing',
        component: () => import('@/views/parse/ParseProcessing.vue'),
        meta: {
          title: '解析处理中',
          description: '查看文档解析任务的实时处理状态。',
          breadcrumb: [{ label: '工作台', name: 'dashboard' }, { label: '解析处理中' }],
        },
      },
      {
        path: 'parse/:jobId/result',
        name: 'parse-result',
        component: () => import('@/views/parse/ParseResult.vue'),
        meta: {
          title: '解析结果',
          description: '查看解析结果并将任务清单保存为项目。',
          navKey: 'parse-records',
          breadcrumb: [
            { label: '工作台', name: 'dashboard' },
            { label: '解析记录', name: 'parse-records' },
            { label: '解析结果' },
          ],
        },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/projects/ProjectListView.vue'),
        meta: {
          title: '项目管理',
          description: '浏览进行中、已归档或已删除项目，查看任务整体进度。',
          navKey: 'projects',
        },
      },
      {
        path: 'projects/:projectId',
        name: 'project-detail',
        component: () => import('@/views/projects/ProjectDetailView.vue'),
        meta: {
          title: '项目任务',
          description: '查看项目任务并更新待办、进行中和已完成状态。',
          navKey: 'projects',
          breadcrumb: [
            { label: '工作台', name: 'dashboard' },
            { label: '项目管理', name: 'projects' },
            { label: '项目任务' },
          ],
        },
      },
      {
        path: 'parses',
        alias: '/history',
        name: 'parse-records',
        component: () => import('@/views/history/HistoryView.vue'),
        meta: {
          title: '解析记录',
          description: '查看历史解析结果与关联项目记录。',
          navKey: 'parse-records',
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: {
          title: '个人中心',
          description: '管理个人资料与界面偏好。',
          navKey: 'profile',
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
