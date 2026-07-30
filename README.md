# TaskPilot Web

> 面向任务型文档的 AI 拆解助手前端仓库

TaskPilot 的产品目标是把“要求文档”转换成可执行的结构化任务，再沉淀为项目与任务管理数据。

目标主链路：

```text
登录 → 文档录入 → 创建解析任务 → 轮询解析状态 → 查看/编辑解析结果 → 保存为项目 → 管理任务
```

配套后端仓库：`taskpilot-server`

---

## 当前阶段（2026-07-30）

当前前端真实进度：

- 已完成：登录、注册、Token 持久化、会话恢复、路由守卫、工作台骨架
- 未完成：文档录入、解析任务轮询、解析结果编辑、项目管理、任务管理、历史记录
- 后端已提供接口：`auth`、`users/me`、`documents`、`parse-jobs`、`parse-results`、`projects`、`tasks`、`history`

当前最需要优先打通的闭环：

```text
文档录入 → 创建解析任务 → 轮询任务状态 → 查看解析结果
```

原因：

- 这是产品核心价值的第一条可验证业务链路
- 它直接衔接后端目前已经开放的 `documents`、`parse-jobs`、`parse-results` 接口
- 只有这条链路跑通，后续“保存项目 / 管理任务”才有真实数据来源

---

## 技术栈

| 分类      | 选型                 |
| --------- | -------------------- |
| 框架      | Vue 3                |
| 构建工具  | Vite                 |
| 语言      | TypeScript           |
| 路由      | Vue Router           |
| 状态管理  | Pinia                |
| HTTP 请求 | Axios                |
| UI 组件库 | Element Plus         |
| 样式      | Sass / CSS Variables |

---

## 当前目录结构

```text
taskpilot-web/
├── src/
│   ├── api/                     # 请求层：client.ts 为 axios 实例，其余按资源拆分
│   │   ├── auth.ts
│   │   └── client.ts
│   ├── components/common/        # 跨模块复用的展示组件（AppPanel、AppStatCard）
│   ├── composables/             # 可复用逻辑（useGreeting、useWorkspaceSidebar）
│   ├── constants/               # 静态配置：导航、应用名、解析状态映射
│   ├── layouts/workspace/       # 工作台布局与其私有子组件
│   │   ├── components/
│   │   └── WorkspaceLayout.vue
│   ├── mocks/                   # 演示数据，接口接入后逐个删除
│   ├── router/                  # index.ts 装配、routes.ts 路由表、guards.ts 守卫
│   ├── stores/
│   ├── styles/
│   ├── types/                   # 全局类型增强（RouteMeta 等）
│   ├── utils/
│   ├── views/                   # 页面级组件，统一 *View.vue 后缀
│   ├── App.vue
│   └── main.ts
├── .env.development
├── .env.production
├── components.d.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

约定：

- 页面级组件统一 `*View.vue` 后缀，只被路由引用
- 只服务单一布局/页面的组件放在其同级 `components/` 下，跨模块复用才提到 `src/components/common/`
- `mocks/` 是临时目录，对应模块接入真实接口后直接删除该文件
- 后续新增 `document.ts`、`parseJob.ts`、`parseResult.ts`、`project.ts`、`task.ts` 后，再同步补齐文档

---

## 当前路由

| 路由         | 页面                        | 说明                             |
| ------------ | --------------------------- | -------------------------------- |
| `/login`     | `LoginView.vue`             | 登录页                           |
| `/register`  | `RegisterView.vue`          | 注册页                           |
| `/dashboard` | `DashboardView.vue`         | 工作台首页，当前使用演示数据     |
| `/parse/new` | `ModulePlaceholderView.vue` | 占位，待接入 documents/parse-jobs |
| `/projects`  | `ModulePlaceholderView.vue` | 占位，待接入 projects/tasks      |
| `/history`   | `ModulePlaceholderView.vue` | 占位，待接入 history             |
| `/profile`   | `ModulePlaceholderView.vue` | 占位，待完善账号设置             |
| `*`          | `NotFoundView.vue`          | 404 页面                         |

占位页的标题、描述、待接入接口清单全部写在路由 `meta` 中，由 `ModulePlaceholderView` 统一渲染。

---

## 当前已实现能力

### 1. 账号体系

- 登录 / 注册
- Token 持久化
- 会话恢复
- 401 自动刷新
- 退出登录
- 路由鉴权

### 2. 工作台骨架

- `WorkspaceLayout`：侧边栏 + 顶栏 + 内容区，窄屏侧边栏转为抽屉
- `WorkspaceSidebar`：唯一的模块导航，支持折叠且折叠态持久化
- `WorkspaceTopbar`：当前页标题、状态标签、新建解析主动作、用户菜单
- `DashboardView`：概览指标、最近解析记录、今日提醒

---

## 后端接口对齐情况

已接入：

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

待接入：

- `POST /api/v1/documents/text`
- `POST /api/v1/documents`
- `GET /api/v1/documents/{documentId}`
- `POST /api/v1/parse-jobs`
- `GET /api/v1/parse-jobs/{jobId}`
- `GET /api/v1/parse-jobs/{jobId}/result`
- `GET /api/v1/parse-results/{resultId}`
- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/{projectId}/tasks`
- `GET /api/v1/history/projects`
- `GET /api/v1/history/parse-results`

---

## 环境变量

`.env.development`

```bash
VITE_API_BASE_URL=/api/v1
```

`.env.production`

```bash
VITE_API_BASE_URL=https://taskpilot.1kuansi.cn/api/v1
```

开发环境下通过 Vite 代理转发 `/api`，避免浏览器侧跨站导致 Cookie 刷新链路失效。

---

## 本地开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```
