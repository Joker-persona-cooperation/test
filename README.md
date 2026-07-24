# TaskPilot Web

> 面向任务型文档的 AI 拆解助手 —— 前端仓库

TaskPilot 是一款 AI 任务拆解工具。用户上传 PDF 文件或粘贴文本后，系统会自动提取文档内的**标题、截止时间、交付物、关键要求、风险提醒、任务清单**，结构化输出后可保存为项目并在任务看板中可视化管理。

前端核心业务主链路：

```
登录 → 上传文档 / 粘贴文本 → 查看解析状态 → 编辑结构化结果 → 保存为项目 → 管理任务
```

配套后端仓库：`taskpilot-server`

---

## 🧱 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Vue 3 |
| 构建工具 | Vite |
| 语言 | TypeScript |
| 路由 | Vue Router |
| 状态管理 | Pinia |
| HTTP 请求 | Axios |
| UI 组件库 | Element Plus |
| 样式 | Sass / CSS Variables |
| 工具库 | Day.js（日期格式化） |

---

## 📁 目录结构

```text
taskpilot-web/
├── public/                # 静态资源（favicon 等）
├── src/
│   ├── api/               # 接口请求封装（按业务模块拆分）
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── document.ts
│   │   ├── parseJob.ts
│   │   ├── parseResult.ts
│   │   ├── project.ts
│   │   └── task.ts
│   ├── assets/            # 图片、图标等静态资源
│   ├── components/        # 通用 / 业务组件（按业务域分目录）
│   │   ├── common/        # 全局通用组件
│   │   ├── auth/          # 登录注册组件
│   │   ├── parse/         # 文档解析模块组件
│   │   ├── project/       # 项目任务看板组件
│   │   └── history/       # 历史记录组件
│   ├── composables/       # 组合式复用逻辑（useAuth / useRequest / usePolling）
│   ├── layouts/           # 页面布局模板（AppLayout / AuthLayout）
│   ├── router/            # 路由配置、路由守卫
│   ├── stores/            # Pinia 全局状态
│   ├── styles/            # 全局样式、主题变量、重置样式
│   ├── types/             # TS 全局类型定义
│   ├── utils/             # 工具函数（请求封装 / 存储 / 格式化 / 常量）
│   ├── views/             # 页面视图（一一对应路由）
│   ├── App.vue
│   └── main.ts
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 目录设计原则

- **`views/`**：页面容器，负责组织布局、发起请求、协调子组件，**不写具体业务逻辑**。
- **`components/`**：可复用组件，按业务域拆目录，不要把所有组件都堆到 `common/`。
- **`api/`**：接口统一封装，禁止在页面内直接写 `axios` 请求。
- **`stores/`**：仅存放**跨页面共享**的全局状态，局部状态留在组件内。
- **`types/`**：接口返回、业务模型、任务模型统一 TS 类型定义。
- **`utils/`**：纯工具函数与基础封装（请求实例、存储、时间格式化）。

---

## 🧭 路由清单

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | LoginView | 登录页 |
| `/register` | RegisterView | 注册页 |
| `/dashboard` | DashboardView | 工作台首页（欢迎信息 / 最近记录 / 今日提醒） |
| `/parse/new` | ParseCreateView | 上传文档 / 粘贴文本、提交解析任务 |
| `/parse/:id` | ParseDetailView | 解析结果详情编辑页 |
| `/projects` | ProjectListView | 项目列表（状态筛选） |
| `/projects/:id` | ProjectDetailView | 项目详情 + 任务看板 |
| `/history` | HistoryView | 历史解析记录 |
| `/profile` | ProfileView | 个人中心 |
| `*` | NotFoundView | 404 页面 |

---

## 🚀 快速开始

### 1. 环境要求

- Node.js ≥ 18
- npm（或 pnpm / yarn）

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发

```bash
npm run dev
```

### 4. 构建生产产物

```bash
npm run build
```

### 5. 预览构建产物

```bash
npm run preview
```

---

## ⚙️ 环境变量

项目通过 `Vite` 的环境变量区分不同运行环境。

`.env.development`（本地开发）

```bash
VITE_APP_TITLE=TaskPilot
VITE_API_BASE_URL=http://localhost:8888/api/v1
```

`.env.production`（线上环境）

```bash
VITE_APP_TITLE=TaskPilot
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## 🧩 核心业务模块

### 1. 账号模块

- 登录 / 注册表单、Token 持久化
- 路由守卫鉴权，未登录自动跳转登录页
- 个人信息查看、昵称修改、退出登录

### 2. 文档 AI 解析模块

- PDF 文件拖拽上传 / 纯文本粘贴双模式
- 解析任务创建、状态轮询（解析中 / 成功 / 失败）
- 结构化结果可视化编辑：文档摘要、截止时间、关键要求、风险提醒、交付物、任务清单

### 3. 项目 & 任务管理模块

- 将解析结果一键保存为独立项目
- 项目列表筛选、基础信息展示
- 任务看板（多列状态泳道）：新增 / 编辑 / 删除任务、修改任务状态

### 4. 历史记录模块

- 展示全部历史解析记录
- 标记是否已生成项目
- 快速回跳解析详情页二次编辑

---

## 🗃️ API 模块拆分

| 文件 | 主要接口 |
| --- | --- |
| `api/auth.ts` | `register`、`login` |
| `api/user.ts` | `getCurrentUser`、`updateCurrentUser` |
| `api/document.ts` | `uploadPdf`、`createTextDocument`、`getDocumentDetail`、`deleteDocument` |
| `api/parseJob.ts` | `createParseJob`、`getParseJobDetail`、`retryParseJob`、`getLatestJobByDocument` |
| `api/parseResult.ts` | `getParseResultDetail`、`getParseResultByJob`、`updateParseResult`、`confirmParseResult` |
| `api/project.ts` | `createProject`、`getProjectList`、`getProjectDetail`、`updateProject` |
| `api/task.ts` | `getProjectTasks`、`createTask`、`updateTask`、`updateTaskStatus`、`deleteTask` |

---

## 💡 状态管理（Pinia）

| Store | 职责 |
| --- | --- |
| `auth.ts` | token、登录态、登录 / 退出动作 |
| `user.ts` | 当前用户信息、拉取用户信息 |
| `upload.ts` | 当前上传文件、解析任务状态 |
| `parse.ts` | 当前解析结果、编辑中的结构化数据 |
| `project.ts` | 当前项目详情、当前任务列表 |

---

## 🎨 样式规范

主题主色统一为 **`#38a5ff`**，通过 CSS Variables 集中管理：

```scss
:root {
  --color-primary: #38a5ff;
  --color-primary-deep: #1f7fd0;
  --color-primary-soft: #e8f5ff;
  --color-bg: #f2f6fa;
  --color-surface: #ffffff;
  --color-text: #16324b;
  --color-text-soft: #58748f;
  --color-border: #d8e5f1;
  --color-success: #1f9a67;
  --color-warning: #ef9f39;
}
```

- 整体清爽商务风，**不做泛 AI 霓虹风**
- 卡片统一圆角、轻阴影
- 表单与卡片共用同一套间距规则，重点区域用主题蓝强化

---

## 🛠️ 开发推进顺序（MVP）

1. **基础设施**：项目初始化、路由 / Pinia / Axios 封装、全局布局与主题
2. **账号体系**：登录、注册、路由守卫、用户信息获取
3. **解析主链路**：上传解析、文件上传、状态轮询、解析详情编辑页
4. **项目任务模块**：保存项目、项目列表、项目详情、任务看板
5. **收尾优化**：历史记录、个人中心、空状态、加载态、异常处理

### 联调优先链路

- 登录：`登录 → 获取 token → 获取用户信息 → 跳转 dashboard`
- 解析：`上传 PDF / 文本 → 创建解析任务 → 轮询状态 → 获取结果`
- 保存项目：`编辑结果 → 保存 → 保存为项目 → 跳转项目页`
- 任务管理：`加载项目任务 → 修改任务状态 → 更新界面`

---

## ✅ MVP 验收标准

前端至少稳定支持：

1. 用户注册与登录
2. 上传 PDF 或粘贴文本
3. 查看解析状态
4. 查看并编辑解析结果
5. 将结果保存为项目
6. 在项目页管理任务
7. 查看历史记录

---

## ⚠️ 常见开发注意事项

- 不要把所有局部状态塞进 Pinia，**仅共享全局数据**入 store
- 页面与组件分层解耦，单个页面文件不宜过长
- 所有接口请求统一封装至 `api/`，杜绝页面内重复写 axios
- 每个关键接口必须处理 `loading / success / error` 三态，完善空页面与加载占位

---

## 📚 配套文档

- 前端开发规范文档：`taskpilot-frontend-dev-guide.md`
- 后端仓库：`taskpilot-server`
