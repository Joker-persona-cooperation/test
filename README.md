# TaskPilot Web

> 面向任务型文档的 AI 拆解助手前端仓库

TaskPilot 的产品目标是把"要求文档"转换成可执行的结构化任务，再沉淀为项目与任务管理数据。

目标主链路：

```text
登录 → 文档录入 → 创建解析任务 → 轮询解析状态 → 查看/编辑解析结果 → 保存为项目 → 管理任务
```

配套后端仓库：`taskpilot-server`

---

## 当前阶段（2026-08-05）

核心主链路已全部闭环并接入真实接口：

- 账号体系：登录 / 注册 / Token 持久化 / 会话恢复 / 401 无感刷新 / 登出
- 文档解析链路：文本录入 → 创建解析任务 → 轮询处理状态 → 编辑 / 确认解析结果
- 项目与任务：解析结果保存为项目 → 项目任务看板（新增 / 编辑 / 删除 / 状态流转 / 排序）→ 归档 / 恢复 / 逻辑删除
- 工作台、解析记录（历史）与个人中心均已接入真实接口

工程约束：仓库没有测试框架、也没有 ESLint，`npm run build`（`vue-tsc -b` 类型检查）是唯一的静态校验手段，改完代码用它验证。分层边界靠 `CLAUDE.md` 的约定人工守。

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
│   ├── api/                     # 请求层：client.ts 为 axios 实例（信封剥离/无感刷新/CSRF），其余按后端资源拆分
│   │   ├── auth.ts
│   │   ├── client.ts
│   │   ├── dashboard.ts         # 工作台接口与类型契约
│   │   ├── document.ts          # 文档接口与类型契约
│   │   ├── errors.ts            # ApiError / SessionExpiredError
│   │   ├── history.ts           # 历史记录接口与类型契约
│   │   ├── parseJob.ts          # 解析任务接口与类型契约
│   │   ├── parseResult.ts       # 解析结果接口与类型契约
│   │   ├── project.ts           # 项目接口与类型契约
│   │   └── task.ts              # 任务接口与类型契约
│   ├── components/common/        # 跨模块复用的无业务感知展示组件（AppPanel、AppStatCard）
│   ├── composables/             # 跨模块通用逻辑（useGreeting、useTheme）
│   ├── constants/               # 静态配置：导航、项目/任务/解析状态映射
│   ├── layouts/workspace/       # 工作台布局与其私有子组件、私有 composable
│   │   ├── components/          # WorkspaceSidebar / WorkspaceTopbar / WorkspaceBreadcrumb
│   │   ├── composables/
│   │   └── WorkspaceLayout.vue
│   ├── router/                  # index.ts 装配、routes.ts 路由表（meta 驱动页面头）、guards.ts 守卫
│   ├── stores/                  # 领域 store：auth / parse / project / dashboard / history
│   ├── styles/                  # 全局样式与主题变量（variables.scss、auth.scss）
│   ├── types/                   # 全局类型增强（RouteMeta 等）
│   ├── utils/                   # storage、date 等叶子工具
│   ├── views/                   # 页面级组件，按业务域垂直切分
│   │   ├── auth/                # 登录、注册
│   │   ├── dashboard/           # 工作台首页
│   │   ├── history/             # 解析记录 / 历史项目
│   │   ├── parse/               # 新建解析、处理中、解析结果
│   │   ├── profile/             # 个人中心
│   │   ├── projects/            # 项目列表、项目任务看板
│   │   └── system/              # 全局兜底页（ModulePlaceholderView、404）
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
- 只服务单一布局/页面的组件与 composable 放在其同级 `components/`、`composables/` 下，跨模块复用才提到 `src/components/common/`、`src/composables/`
- 分层单向依赖：`views/layouts → stores → api → utils/constants`，不允许反向或跨层；视图组件不得直接 import `api/`
- 单页面自足的数据请求可放页面私有 composable（`views/<domain>/composables/`）直接调 `api/`，出现第二个消费方或需要在路由跳转后保持状态时提升为领域 store；详见 `CLAUDE.md` 分层边界
- `goals/` 下的静态 HTML 是各页面的视觉与交互参考，不参与构建

---

## 当前路由

| 路由                          | 页面                        | 说明                                        |
| ----------------------------- | --------------------------- | ------------------------------------------- |
| `/login`                      | `LoginView.vue`             | 登录页                                      |
| `/register`                   | `RegisterView.vue`          | 注册页                                      |
| `/`                           | 重定向                      | 跳转 `/dashboard`                           |
| `/dashboard`                  | `DashboardView.vue`         | 工作台首页                                  |
| `/parse/new`                  | `ParseNew.vue`              | 文本录入并创建解析任务                      |
| `/parse/:jobId/processing`    | `ParseProcessing.vue`       | 轮询解析任务状态                            |
| `/parse/:jobId/result`        | `ParseResult.vue`           | 编辑、确认解析结果并保存为项目              |
| `/projects`                   | `ProjectListView.vue`       | 进行中 / 已归档 / 已删除项目列表            |
| `/projects/:projectId`        | `ProjectDetailView.vue`     | 项目任务看板及任务状态更新                  |
| `/parses`（alias `/history`） | `HistoryView.vue`           | 解析记录与历史项目                          |
| `/profile`                    | `ProfileView.vue`           | 个人中心                                    |
| `*`                           | `NotFoundView.vue`          | 404 页面                                    |

页面标题、描述与导航归属统一写在路由 `meta` 中，由 `WorkspaceTopbar` 与导航组件读取渲染，页面组件内不重复渲染 `<h1>` 或页面描述。

---

## 当前已实现能力

### 1. 账号体系

- 登录 / 注册（含 Redis 限流，后端负责）
- Token 持久化（localStorage Bearer + HttpOnly Cookie 双轨）
- 会话恢复（`bootstrapSession` 预热 + 路由守卫 await 去重）
- 401 无感刷新（并发只刷一次，其余请求排队重试；`/auth/refresh` 与公开接口排除在刷新逻辑外）
- 会话失效统一处理：请求层抛 `SessionExpiredError` → `main.ts` 注入的 handler 清会话 → 跳登录并保留 `redirect` 回跳
- 退出登录、路由鉴权、CSRF 双 Cookie 回填

### 2. 工作台布局

- `WorkspaceLayout`：侧边栏 + 顶栏 + 面包屑 + 内容区，窄屏侧边栏转为抽屉
- `WorkspaceSidebar`：唯一的模块导航，支持折叠且折叠态持久化，导航项集中配置在 `constants/navigation.ts`
- `WorkspaceTopbar`：路由 meta 驱动的页面标题 / 描述、新建解析主动作、用户菜单、主题切换
- `DashboardView`：概览指标、最近解析记录、今日提醒

### 3. 文档解析链路

- 文本录入（标题 + 正文表单校验），创建文档并生成解析任务
- 处理中页 3 秒轮询任务状态，支持失败分类提示与原地重试
- 解析结果页：原文预览 + 交付物 / 关键要求 / 风险提醒 / AI 任务建议清单编辑，乐观锁保存，幂等确认
- 结果确认后支持"保存为项目"（幂等，重复请求返回已有项目并跳转详情）

### 4. 项目与任务管理

- 项目列表：active / archived / deleted 三态切换，分页加载，支持从已确认且未建项目的解析结果创建
- 项目详情看板：todo / doing / done 三列，任务新增 / 编辑 / 删除 / 状态流转
- 排序：拖拽与上移下移按钮双通道，完整集合事务提交，失败回滚到服务端权威顺序
- 乐观锁冲突处理（`code 10007`）：项目与任务编辑冲突时自动刷新最新版本
- 归档 / 恢复 / 逻辑删除，归档后只读；删除后仅可在历史记录查看

### 5. 历史与个人中心

- 解析记录与历史项目分页查询，历史项目详情只读（含任务）
- 个人资料编辑（昵称 / 头像），成功后轮换当前设备会话

---

## 后端接口对齐情况

前端 `src/api/` 已全部封装并接入真实接口：

- `POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`POST /api/v1/auth/refresh`、`POST /api/v1/auth/logout`
- `GET /api/v1/users/me`、`PUT /api/v1/users/me`
- `POST /api/v1/documents/text`、`GET /api/v1/documents/:documentId`
- `POST /api/v1/parse-jobs`、`GET /api/v1/parse-jobs/:jobId`、`POST /api/v1/parse-jobs/:jobId/retry`
- `GET /api/v1/parse-jobs/:jobId/result`、`GET /api/v1/parse-results/:resultId`、`PUT /api/v1/parse-results/:resultId`、`POST /api/v1/parse-results/:resultId/confirm`
- `POST /api/v1/projects`、`GET /api/v1/projects`、`GET /api/v1/projects/:projectId`、`PUT /api/v1/projects/:projectId`
- `POST /api/v1/projects/:projectId/archive`、`POST /api/v1/projects/:projectId/unarchive`、`DELETE /api/v1/projects/:projectId`
- `GET /api/v1/projects/:projectId/tasks`、`POST /api/v1/projects/:projectId/tasks`
- `PUT /api/v1/tasks/:taskId`、`PATCH /api/v1/tasks/:taskId/status`、`DELETE /api/v1/tasks/:taskId`、`POST /api/v1/tasks/reorder`
- `GET /api/v1/dashboard/...`、`GET /api/v1/history/projects`、`GET /api/v1/history/parse-results`

接口契约与错误码细节见 `docs/api-contract.md`、`docs/error-codes-and-enums.md`。

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
