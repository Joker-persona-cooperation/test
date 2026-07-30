# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

TaskPilot Web 是「任务型文档 AI 拆解助手」的前端仓库，配套后端仓库为 `taskpilot-server`。产品主链路：

```text
登录 → 文档录入 → 创建解析任务 → 轮询解析状态 → 查看/编辑解析结果 → 保存为项目 → 管理任务
```

当前只有账号体系与工作台骨架落地，`parse/new`、`projects`、`history`、`profile` 四个路由都还指向占位页 `ModulePlaceholderView.vue`。最高优先级的闭环是 `documents → parse-jobs → parse-results`。

## 常用命令

```bash
npm install          # Node 版本固定为 22.23.1（.nvmrc / .node-version）
npm run dev          # Vite 开发服务器，端口 5173
npm run build        # vue-tsc -b 类型检查 + vite build（类型错误会阻断构建）
npm run preview      # 预览构建产物
npm run format       # Prettier 格式化 src 下 ts/vue/scss/css/json
```

仓库没有测试框架、也没有 ESLint。类型检查是唯一的静态校验手段，改完代码用 `npm run build`（或单独 `npx vue-tsc -b`）验证。`tsconfig.app.json` 开了 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`，未使用的变量会直接编译失败。

## 架构要点

### 请求层：信封 + 无感刷新（`src/api/client.ts`）

后端统一返回信封 `{ code, message, data }`。这一层做了三件事，新增 API 模块时务必沿用而不要绕开：

- 响应拦截里 `code !== 0` 视为业务失败，自动 `ElMessage.error` 并 reject，调用方只需 catch，不用再弹提示。
- 导出的 `http.get/post/put/delete` 直接返回 `data` 字段（已剥离信封），返回类型即业务数据类型。新 API 文件写成 `src/api/xxx.ts`，导出纯函数 + 接口类型，参照 `src/api/auth.ts`。
- 401 无感刷新：受保护接口 401 时用 refresh cookie 换新 access token 并重试一次，并发 401 只刷新一次、其余请求排队（`isRefreshing` + `pendingQueue`）。`/auth/refresh` 自身和 `/login`、`/register` 被排除在刷新逻辑之外，避免死循环。

鉴权是「Bearer + Cookie」双轨：access token 存 localStorage 并由请求拦截注入 `Authorization`；refresh token 与 csrf token 走 Cookie，`withCredentials: true`，csrf 从非 HttpOnly cookie 读出后回填 `X-CSRF-Token` 头（`src/utils/storage.ts`）。

### 开发代理为什么必须存在

`.env.development` 里 `VITE_API_BASE_URL=/api/v1`，由 `vite.config.ts` 的 proxy 转发到 `https://dev.taskpilot.1kuansi.cn`。目的是让浏览器侧始终同源请求，否则 refresh/csrf Cookie 落入跨站场景，无感刷新链路会失效。不要为了「方便」把 dev 的 baseURL 改成远端绝对地址。生产环境走 `.env.production` 的绝对地址。

### 会话引导：bootstrapSession（`src/stores/auth.ts` + `src/router/guards.ts`）

`main.ts` 在挂载前先 `void bootstrapSession()` 预热，路由守卫在 `!bootstrapped || bootstrapping` 时 await 同一个 promise（`bootstrapPromise` 做去重），保证刷新页面时守卫不会在会话探测完成前误判为未登录。

探测方式是统一调用 `GET /users/me`，同时覆盖三种情况：本地 Bearer 有效 / 仅 Cookie 有效 / access 过期但 refresh 有效（由请求层自动刷新重试）。只有明确的 401 才 `clearSession()`，5xx 与网络抖动保留本地状态。改动这块时保持这个约定，否则弱网下用户会被莫名踢出登录。

### 路由 meta 驱动页面头（`src/router/routes.ts`）

工作台页面的标题、描述、状态标签都写在路由 `meta` 里，由 `WorkspaceTopbar.vue` 和 `ModulePlaceholderView.vue` 读取渲染：`title`、`description`、`statusLabel`、`suggestedActions`、`endpointGroups`、`public`。meta 字段类型集中声明在 `src/types/router.d.ts`，读取时不需要 `as string` 断言。占位路由的 `endpointGroups` 记录了该模块待接入的后端接口，是实现新模块时的对照清单。

标题由顶栏统一承担，页面组件内不要再重复渲染 `<h1>` 或页面描述。守卫用 `meta.public` 判断免鉴权页，`afterEach` 里同步 `document.title`。

导航项集中在 `src/constants/navigation.ts`（`workspaceNavItems` + `isWorkspaceNavActive` + `findWorkspaceNavItem`），图标也在这份数据里，侧边栏与移动端抽屉共用。新增模块要同时改 `routes.ts` 和这份导航配置。

### 组件与样式

- Element Plus 通过 `unplugin-vue-components` 按需自动导入，`components.d.ts` 由插件生成，不要手写。模板里直接用 `<el-button>` 无需 import；`ElMessage` 这类非组件 API 仍需显式 import，样式已在 `main.ts` 引入。
- 主题色集中在 `src/styles/variables.scss` 的 CSS 变量（品牌主色 `#38a5ff`），同时覆盖了 `--el-color-primary` 系列。写样式用这些变量，不要硬编码色值。
- 组件样式统一 `<style lang="scss" scoped>` + BEM 风格嵌套（`&__element`、`&.is-active`）。
- 全部 SFC 使用 `<script setup lang="ts">`，路径别名 `@/` → `src/`。
- 面板卡片用 `AppPanel`，指标卡用 `AppStatCard`（传语义 `tone`，不要手写 hex）。登录/注册的页面骨架样式在 `src/styles/auth.scss`，两页只保留各自独有的 scoped 规则。
- 可交互元素要给 `:focus-visible` 轮廓；有动效的地方补 `@media (prefers-reduced-motion: reduce)`。当前选中的导航项要带 `aria-current="page"`。

### `goals/` 目录

静态 HTML 设计稿（`dashboard.html`、`parse-new.html`、`parse-detail.html` 等），是各页面的视觉与交互参考。实现新页面前先看对应的 HTML 原型。这些文件不参与构建。

## 代码风格

Prettier 配置：无分号、单引号、printWidth 80、trailing comma all、LF。注释与 UI 文案用中文，注释解释「为什么」而非「做了什么」——现有代码里的注释大多在说明约束原因（比如为什么必须走代理、为什么只在 401 时清会话），保持这个密度和风格。
