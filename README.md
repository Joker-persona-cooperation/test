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
│   ├── api/
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── components/
│   │   └── layout/
│   ├── layouts/
│   ├── router/
│   ├── stores/
│   ├── styles/
│   ├── utils/
│   ├── views/
│   ├── App.vue
│   └── main.ts
├── .env.development
├── .env.production
├── components.d.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

说明：

- 文档只描述当前仓库中真实存在的结构，不提前声明未落地目录
- 后续新增 `document.ts`、`parseJob.ts`、`parseResult.ts`、`project.ts`、`task.ts` 后，再同步补齐文档

---

## 当前路由

| 路由         | 页面                    | 说明                                   |
| ------------ | ----------------------- | -------------------------------------- |
| `/login`     | `Login.vue`             | 登录页                                 |
| `/register`  | `Register.vue`          | 注册页                                 |
| `/dashboard` | `DashboardHomeView.vue` | 工作台首页，展示当前阶段与下一优先闭环 |
| `*`          | `NotFound.vue`          | 404 页面                               |

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

- `WorkspaceLayout`
- `WorkspaceHeader`
- `WorkspaceNavigation`
- `WorkspacePageHeader`
- `DashboardHomeView`

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
