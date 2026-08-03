# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

TaskPilot Web 是「任务型文档 AI 拆解助手」的前端仓库，配套后端仓库为 `taskpilot-server`。产品主链路：

```text
登录 → 文档录入 → 创建解析任务 → 轮询解析状态 → 查看/编辑解析结果 → 保存为项目 → 管理任务
```

当前账号体系与核心主链路已经落地：文本录入、异步解析、结果编辑与确认、保存为项目、查看项目任务、更新任务状态。`history`、`profile` 仍为占位页，工作台仍使用演示数据；下一阶段优先补历史回溯与工作台真实数据。

## 常用命令

```bash
npm install          # Node 版本固定为 22.23.1（.nvmrc / .node-version）
npm run dev          # Vite 开发服务器，端口 5173
npm run build        # vue-tsc -b 类型检查 + vite build（类型错误会阻断构建）
npm run preview      # 预览构建产物
npm run format       # Prettier 格式化 src 下 ts/vue/scss/css/json
```

仓库没有测试框架、也没有 ESLint。类型检查是唯一的静态校验手段，改完代码用 `npm run build`（或单独 `npx vue-tsc -b`）验证。`tsconfig.app.json` 开了 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`，未使用的变量会直接编译失败。

因为没有 lint，分层边界只能靠人工守。改完 `api/` 或 `stores/` 后自查一遍：`api/` 里有没有出现 `window.`、`router`、`stores/`；`constants/`、`utils/` 里有没有 import 上层模块。

## 架构要点

### 分层边界（改动前先确认自己在哪一层）

四层单向依赖，不允许反向或跨层：

```text
views / layouts  →  stores  →  api  →  utils / constants
```

- `api/` 只做「请求 + 类型」。不碰 `window.location`、不写路由跳转、不直接改业务状态。唯一例外是响应拦截里的 `ElMessage.error` 与 token 读写，这是既有约定。
- `stores/` 是会话与业务状态的唯一持有者。视图不直接调 `api/`（当前 auth 链路已遵守），新模块沿用：视图 → store action → api 函数。
- `views/` 只做编排与呈现：读 store、调 action、渲染。派生计算超过十几行或要被两个页面复用时，提到同模块的 `composables/`。
- `constants/` 与 `utils/` 是叶子层，禁止 import `api/`、`stores/`、组件。`constants/parseStatus.ts` 依赖 `element-plus` 的 `TagProps` 类型属于类型级依赖，可接受。

会话失效的处理链路是这套边界的样板，改动时不要走回头路：请求层抛 `SessionExpiredError` → `main.ts` 注入的 handler 调 `store.clearSession()` → `router.push` 带 `redirect` 跳登录。请求层不 import `stores/` 与 `router`（否则 api → stores → api 循环依赖），跳转也不能用 `window.location.href`（整页刷新会丢掉 `redirect` 回跳参数）。

### 请求层：信封 + 无感刷新（`src/api/client.ts`）

后端统一返回信封 `{ code, message, data }`。这一层做了三件事，新增 API 模块时务必沿用而不要绕开：

- 响应拦截里 `code !== 0` 视为业务失败，自动 `ElMessage.error` 并 reject，调用方只需 catch，不用再弹提示。
- 所有失败都被包装成 `src/api/errors.ts` 的 `ApiError`（带 `status`、`code`），会话失效则是其子类 `SessionExpiredError`。调用方判断失败原因用 `isApiError` / `isSessionExpired`，**不要用 axios 的 `isAxiosError`**——包装后它恒为 `false`。新增错误分支时保证仍抛这两个类型，否则上层的会话清理会静默失效。
- 导出的 `http.get/post/put/delete` 直接返回 `data` 字段（已剥离信封），返回类型即业务数据类型。新 API 文件写成 `src/api/xxx.ts`，导出纯函数 + 接口类型，参照 `src/api/auth.ts`。
- 401 无感刷新：受保护接口 401 时用 refresh cookie 换新 access token 并重试一次，并发 401 只刷新一次、其余请求排队（`isRefreshing` + `pendingQueue`）。`/auth/refresh` 自身和 `/login`、`/register` 被排除在刷新逻辑之外，避免死循环。刷新只在 `client.ts` 内部用原始 axios 实例发起，`api/auth.ts` 因此故意不导出 `refresh()`——经 `http.post` 走一遍拦截会让 refresh 自身的 401 再次触发刷新而死循环。

鉴权是「Bearer + Cookie」双轨：access token 存 localStorage 并由请求拦截注入 `Authorization`；refresh token 与 csrf token 走 Cookie，`withCredentials: true`，csrf 从非 HttpOnly cookie 读出后回填 `X-CSRF-Token` 头（`src/utils/storage.ts`）。

### 开发代理为什么必须存在

`.env.development` 里 `VITE_API_BASE_URL=/api/v1`，由 `vite.config.ts` 的 proxy 转发到 `https://dev.taskpilot.1kuansi.cn`。目的是让浏览器侧始终同源请求，否则 refresh/csrf Cookie 落入跨站场景，无感刷新链路会失效。不要为了「方便」把 dev 的 baseURL 改成远端绝对地址。生产环境走 `.env.production` 的绝对地址。

### 会话引导：bootstrapSession（`src/stores/auth.ts` + `src/router/guards.ts`）

`main.ts` 在挂载前先 `void bootstrapSession()` 预热，路由守卫在 `!bootstrapped || bootstrapping` 时 await 同一个 promise（`bootstrapPromise` 做去重），保证刷新页面时守卫不会在会话探测完成前误判为未登录。

探测方式是统一调用 `GET /users/me`，同时覆盖三种情况：本地 Bearer 有效 / 仅 Cookie 有效 / access 过期但 refresh 有效（由请求层自动刷新重试）。只有 `isSessionExpired(error)` 成立才 `clearSession()`，5xx 与网络抖动保留本地状态。改动这块时保持这个约定，否则弱网下用户会被莫名踢出登录。

`isLoggedIn` 判定的是 `!!userInfo`，不是「本地有 access token」。因为鉴权是 Bearer + Cookie 双轨，仅 Cookie 有效时 `/users/me` 会成功但 localStorage 里没有 Bearer，用 token 判断会把已登录用户挡在守卫外面。新增登录态相关逻辑时沿用 `userInfo` 这个基准。

### 路由 meta 驱动页面头（`src/router/routes.ts`）

工作台页面的标题、描述、状态标签都写在路由 `meta` 里，由 `WorkspaceTopbar.vue` 和 `ModulePlaceholderView.vue` 读取渲染：`title`、`description`、`statusLabel`、`suggestedActions`、`endpointGroups`、`public`。meta 字段类型集中声明在 `src/types/router.d.ts`，读取时不需要 `as string` 断言。占位路由的 `endpointGroups` 记录了该模块待接入的后端接口，是实现新模块时的对照清单。

标题由顶栏统一承担，页面组件内不要再重复渲染 `<h1>` 或页面描述。守卫用 `meta.public` 判断免鉴权页，`afterEach` 里同步 `document.title`。

导航项集中在 `src/constants/navigation.ts`（`workspaceNavItems` + `isWorkspaceNavActive` + `findWorkspaceNavItem`），图标也在这份数据里，侧边栏与移动端抽屉共用。新增模块要同时改 `routes.ts` 和这份导航配置。

### 新模块按业务垂直切分，不要按文件类型摊平

现有 `views/` 是扁平的，因为只有 auth 与 dashboard 两块。落地 `parse` / `projects` / `history` 时按业务域就近组织，同一模块的页面、私有组件、私有 composable、模块类型放在一起：

```text
src/modules/parse/
├── views/ParseCreateView.vue      # 只被路由引用
├── components/UploadPanel.vue     # 只服务本模块，不进 components/common/
├── composables/useParseJobPolling.ts
└── types.ts
```

判定标准：被两个以上业务模块引用才提升到 `src/components/common/`（纯展示、不含业务语义、不 import store）或 `src/composables/`。只有一个模块用就留在模块内——宁可后面提升，也不要提前放进公共目录。

`api/` 与 `stores/` 保持按资源平铺（`api/parseJob.ts`、`stores/parseJob.ts`），不要塞进模块目录，因为跨模块共享是常态（`history` 与 `parse` 都要读 parse-results）。

已就位的归属约定：全局兜底页在 `views/system/`（`ModulePlaceholderView`、`NotFoundView`），不属于任何业务域；只服务某个布局的 composable 跟着布局走（`layouts/workspace/composables/useWorkspaceSidebar.ts`），布局内部用相对路径 import 以体现私有性；`composables/` 根目录只留跨模块通用且无业务语义的（如 `useGreeting`）。

`mocks/` 只放假数据，类型定义放 `api/`：`mocks/dashboard.ts` 的数据形状由 `api/dashboard.ts` 的 `DashboardStats` 等类型约束。mock 文件在接口接入后整体删除，类型留下继续用——所以别把业务契约类型写进 `mocks/`。

### 组件与样式

- Element Plus 通过 `unplugin-vue-components` 按需自动导入，`components.d.ts` 由插件生成，不要手写。模板里直接用 `<el-button>` 无需 import；`ElMessage` 这类非组件 API 仍需显式 import，样式已在 `main.ts` 引入。
- 主题色集中在 `src/styles/variables.scss` 的 CSS 变量（品牌主色 `#38a5ff`），同时覆盖了 `--el-color-primary` 系列。写样式用这些变量，不要硬编码色值。
- 组件样式统一 `<style lang="scss" scoped>` + BEM 风格嵌套（`&__element`、`&.is-active`）。
- 全部 SFC 使用 `<script setup lang="ts">`，路径别名 `@/` → `src/`。
- 面板卡片用 `AppPanel`，指标卡用 `AppStatCard`（传语义 `tone`，不要手写 hex）。登录/注册的页面骨架样式在 `src/styles/auth.scss`，两页只保留各自独有的 scoped 规则。
- `components/common/` 下的组件必须保持「无业务感知」：不 import store、不 import `api/`、不读路由。需要交互就通过 props / slots / emit 由调用方注入。
- 状态色有 `soft`（浅底）/ `deep`（深字）配对 token：`--color-{primary,warning,success,danger}-{soft,deep}`。`AppStatCard` 的 `tone` 只做「语义 → token」映射，组件内不出现 hex，新增语义色时先往 `variables.scss` 补 token。
- `styles/` 只放全局与跨页共享样式。`auth.scss` 是全局非 scoped 的类名（`.auth-page` 等），继续往里加页面级样式会污染全局作用域；新增模块的共享样式优先做成模块内的 scoped 规则或 SCSS mixin。
- 可交互元素要给 `:focus-visible` 轮廓；有动效的地方补 `@media (prefers-reduced-motion: reduce)`。当前选中的导航项要带 `aria-current="page"`。

### `goals/` 目录

静态 HTML 设计稿（`dashboard.html`、`parse-new.html`、`parse-detail.html` 等），是各页面的视觉与交互参考。实现新页面前先看对应的 HTML 原型。这些文件不参与构建。

## 代码风格

Prettier 配置：无分号、单引号、printWidth 80、trailing comma all、LF。注释与 UI 文案用中文，注释解释「为什么」而非「做了什么」——现有代码里的注释大多在说明约束原因（比如为什么必须走代理、为什么只在 401 时清会话），保持这个密度和风格。
