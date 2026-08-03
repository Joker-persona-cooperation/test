# 前端接口对接清单（TaskPilot Web）

> 本文档由后端 `taskpilot-server/docs/openapi.yaml` 整理而来，**面向前端联调**。
> 后端前缀统一为 `/api/v1`。所有接口（除注册/登录外）均需鉴权。

---

## 0. 全局约定（先读这一节）

### 0.1 基础地址
- 本地：`http://localhost:8888`（由前端环境变量 `VITE_API_BASE_URL` 控制）
- 已被 `src/api/client.ts` 设为 `baseURL`，调用时**只写相对路径**（如 `/documents`）。

### 0.2 统一响应信封
所有接口（成功与失败）都返回：
```json
{ "code": 0, "message": "ok", "data": ... }
```
- `code === 0`：成功；非 0：业务错误（此时 `data` 为 `null`，`message` 可直接 `ElMessage.error` 展示）。
- 前端 `client.ts` 已统一处理：非 0 自动 `reject(new ApiError)`，并弹出 `message`。

### 0.3 鉴权机制（关键！）
- **默认走 Bearer**：请求头 `Authorization: Bearer <access_token>`。`client.ts` 请求拦截器自动注入（token 存 localStorage）。
- **Cookie 兜底**：后端也支持 access Cookie（HttpOnly）。但本前端采用 Bearer 通道，无需依赖 Cookie 鉴权读接口。
- **CSRF（仅 refresh / logout 需要）**：`/auth/refresh`、`/auth/logout` 强制走 Cookie + CSRF。后端把 CSRF token 写在**非 HttpOnly** cookie（`csrf_token`），前端从 cookie 读取并回填到请求头 `X-CSRF-Token`。`client.ts` 已自动注入该头；`storage.ts` 的 `getCsrfToken()` 负责读取。

### 0.4 无感刷新（已内置）
- 受保护接口返回 `401` 时，`client.ts` 自动用 refresh Cookie 调 `/auth/refresh` 换新 access token 并重试一次，并发 401 只刷新一次（队列机制）。
- **刷新必须由 `client.ts` 内部用原始 axios 实例发起**，不能经 `http.post`（否则 refresh 自身 401 会死循环）。所以 `auth.ts` 不导出 `refresh()`。
- refresh 失败 / 重试后仍 401：触发 `SessionExpiredError`，由 `main.ts` 绑定的 handler 清会话 + 跳登录。

### 0.5 状态码速查
| HTTP | 含义 | 前端动作 |
|---|---|---|
| 200 + code 0 | 成功 | 取 `data` |
| 200 + code ≠ 0 | 业务错误 | 弹 `message`，`reject ApiError` |
| 400 | 参数校验失败 | 弹 `message` |
| 401 | 未登录/过期 | 触发无感刷新；刷新失败跳登录 |
| 403 | CSRF/权限 | 弹 `message` |
| 409 | 冲突（幂等冲突、并发版本冲突等） | 弹 `message`，前端按需拉最新数据 |
| 404 | 资源不存在 | 弹 `message` |
| 503 | 依赖不可用（如 Redis 未就绪） | 弹 `message` |

---

## 1. 认证与用户

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| POST | `/auth/register` | 公开 | 注册，返回 user + access_token，并写 access/refresh/csrf Cookie | `auth.register` |
| POST | `/auth/login` | 公开 | 登录，同上 | `auth.login` |
| POST | `/auth/refresh` | Cookie+CSRF | 轮换会话，返回新 access_token 并改写 Cookie | 内部（`client.ts`） |
| POST | `/auth/logout` | Cookie+CSRF | 撤销当前设备会话，清 Cookie | `auth.logout` |
| GET | `/users/me` | Bearer | 当前用户资料 | `auth.fetchProfile` |

**请求体**
- 注册：`{ nickname, email, password }`
- 登录：`{ email, password }`
- email 后端会 `trim + lower` 规范化，大小写不敏感去重。

**响应 data（AuthResult）**
```json
{ "user": { "id": 1, "email": "...", "nickname": "..." , "avatar_url": "..."},
  "access_token": "...", "expires_in_sec": 900 }
```

✅ 前端 `src/api/auth.ts` **已完整覆盖**，无需改动。

---

## 2. 文档 Documents

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| POST | `/documents/text` | Bearer | 创建文本文档 | `document.createTextDocument` |
| GET | `/documents` | Bearer | 分页查当前用户文档 | `document.fetchDocuments` |
| GET | `/documents/:documentId` | Bearer | 文档详情 | `document.fetchDocument` |
| DELETE | `/documents/:documentId` | Bearer | 删除文档（软删） | `document.deleteDocument` |

**创建文本文档请求体**
```json
{ "title": "需求文档", "content": "..." }
```
**文档对象（data）**
```json
{
  "id": 1, "title": "需求文档", "source_type": "text",
  "status": "uploaded", "created_at": "2026-08-03T10:00:00Z",
  "updated_at": "2026-08-03T10:00:00Z"
}
```
`source_type` 枚举：`pdf` / `text`；`status`：`uploaded` / `ready` / `failed`。

**分页 GET `/documents` 查询参数与返回**
- query：`page`（默认 1）、`page_size`（默认 20）
- data：`{ items: [...], total: 42, page: 1, page_size: 20 }`

⚠️ **缺口检查**：请确认 `document.ts` 是否已按 `{items,total,page,page_size}` 结构解析分页返回（openapi 的 data 为此结构，与 `http.get<T>` 直接返回 `data` 一致）。若 `document.ts` 未处理分页字段，需补。

---

## 3. 解析任务 Parse Jobs

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| POST | `/parse-jobs` | Bearer | 创建待处理解析任务 | `parseJob.createParseJob` |
| GET | `/parse-jobs/:jobId` | Bearer | 查询任务 | `parseJob.fetchParseJob` |
| POST | `/parse-jobs/:jobId/retry` | Bearer | 重试失败任务 | `parseJob.retryParseJob` |
| GET | `/documents/:documentId/latest-job` | Bearer | 文档最新解析任务 | `parseJob.fetchLatestJob` |

**创建请求体**
```json
{ "document_id": 1, "job_type": "ai_parse" }
```
**解析任务对象（data）**
```json
{
  "id": 1, "document_id": 1, "job_type": "ai_parse",
  "status": "pending", "attempts": 0, "created_at": "...", "updated_at": "..."
}
```
`status`：`pending` / `processing` / `success` / `failed`。
前端轮询 `GET /parse-jobs/:jobId` 直到 `status` 为 `success` 或 `failed`。

✅ 前端 `src/api/parseJob.ts` 已覆盖（按现有封装）。

---

## 4. 解析结果 Parse Results

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| GET | `/parse-jobs/:jobId/result` | Bearer | 按任务查结果 | `parseResult.fetchByJob` |
| GET | `/parse-results/:resultId` | Bearer | 查结果 | `parseResult.fetchResult` |
| PUT | `/parse-results/:resultId` | Bearer | 乐观锁编辑未确认结果 | `parseResult.updateResult` |
| POST | `/parse-results/:resultId/confirm` | Bearer | 幂等确认 | `parseResult.confirmResult` |

**解析结果对象（data）**
```json
{
  "id": 1, "parse_job_id": 1, "document_id": 1,
  "is_confirmed": false, "version": 1,
  "deliverables": [ ... ],        // jsonb
  "key_requirements": [ ... ],    // jsonb
  "risk_warnings": [ ... ],       // jsonb
  "generated_tasks": [ ... ],     // jsonb（解析阶段快照）
  "created_at": "...", "updated_at": "..."
}
```
**乐观锁（重要）**：`PUT` / `confirm` 需携带当前 `version`；若后端已变更会返回 **409**（并发冲突）。前端应先重新 `GET` 拿最新 `version` 再提交。

✅ 前端 `src/api/parseResult.ts` 已覆盖。

---

## 5. 项目 Projects

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| POST | `/projects` | Bearer | 已确认结果保存为项目（幂等） | `project.createProject` |
| GET | `/projects` | Bearer | 分页查 active/archived | `project.fetchProjects` |
| GET | `/projects/:projectId` | Bearer | 项目详情（非 deleted） | `project.fetchProject` |
| PUT | `/projects/:projectId` | Bearer | 乐观锁编辑 active 项目 | `project.updateProject` |
| POST | `/projects/:projectId/archive` | Bearer | 幂等归档 | `project.archiveProject` |
| POST | `/projects/:projectId/unarchive` | Bearer | 幂等恢复 | `project.unarchiveProject` |
| DELETE | `/projects/:projectId` | Bearer | 逻辑删 archived 项目 | `project.deleteProject` |

**创建项目请求体**
```json
{ "parse_result_id": 1 }
```
**项目对象（data）**
```json
{
  "id": 1, "name": "...", "parse_result_id": 1,
  "status": "active", "version": 1,
  "created_at": "...", "updated_at": "..."
}
```
`status`：`active` / `archived` / `deleted`。

✅ 前端 `src/api/project.ts` 已覆盖。

---

## 6. 任务 Tasks

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| GET | `/projects/:projectId/tasks` | Bearer | 查项目任务 | `project.fetchTasks`（或 task 模块） |
| POST | `/projects/:projectId/tasks` | Bearer | 新增手动任务 | — |
| PUT | `/tasks/:taskId` | Bearer | 乐观锁编辑任务 | — |
| PATCH | `/tasks/:taskId/status` | Bearer | 更新状态 | — |
| DELETE | `/tasks/:taskId` | Bearer | 物理删除 | — |
| POST | `/tasks/reorder` | Bearer | 完整集合事务排序 | — |

**任务对象（data）**
```json
{
  "id": 1, "project_id": 1, "title": "...", "description": "...",
  "status": "todo", "priority": "medium", "source_type": "ai",
  "order_index": 1, "version": 1,
  "created_at": "...", "updated_at": "..."
}
```
- `status`：`todo` / `doing` / `done`
- `priority`：`low` / `medium` / `high`
- `source_type`：`ai`（保存项目时由快照展开）/ `manual`（项目内手动新增）
- `order_index`：排序用；`POST /tasks/reorder` 接收完整有序集合做事务重排。

⚠️ **缺口检查**：`src/api/` 下目前**没有 task 模块文件**（只有 `project.ts` 可能内含 `fetchTasks`）。下列 6 个接口中，**新增/编辑/状态/删除/排序 5 个写操作尚未封装**，联调前需要新建 `src/api/task.ts` 补齐：
- `POST /projects/:projectId/tasks`
- `PUT /tasks/:taskId`
- `PATCH /tasks/:taskId/status`
- `DELETE /tasks/:taskId`
- `POST /tasks/reorder`

---

## 7. 历史 History（只读）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/history/projects` | Bearer | 全状态项目历史（分页） |
| GET | `/history/projects/:projectId` | Bearer | 历史项目详情 |
| GET | `/history/projects/:projectId/tasks` | Bearer | 历史项目任务 |
| GET | `/history/parse-results` | Bearer | 解析结果历史 |

⚠️ **缺口检查**：前端目前未见 history 的 api 封装，若 Dashboard/历史页要联调，需新建 `src/api/history.ts`。

---

## 8. 工作台 Dashboard

| 方法 | 路径 | 鉴权 | 说明 | 前端封装 |
|---|---|---|---|---|
| GET | `/dashboard/stats` | Bearer | 查询当前用户的四项工作台概览统计 | 待在 `dashboard.ts` 补充 |
| GET | `/dashboard/reminders` | Bearer | 查询未来 7×24 小时内到期的未完成任务 | 待在 `dashboard.ts` 补充 |

### 8.1 概览统计

`GET /dashboard/stats` 的响应 `data`：

```json
{
  "documents": 12,
  "parse_jobs": 8,
  "active_projects": 5,
  "open_tasks": 23
}
```

统计口径：

- `documents`：当前用户未软删除的文档总数。
- `parse_jobs`：当前用户的解析任务总数，包含全部任务状态。
- `active_projects`：当前用户状态为 `active` 的项目总数。
- `open_tasks`：当前用户 active 项目内状态为 `todo` 或 `doing` 的任务总数，不统计 archived/deleted 项目任务。

### 8.2 今日提醒

`GET /dashboard/reminders` 的响应 `data`：

```json
{
  "items": [
    {
      "id": 101,
      "project_id": 20,
      "title": "提交项目说明书",
      "project": "创新创业比赛报名",
      "deadline": "2026-08-05T18:00:00+08:00",
      "days_left": 2
    }
  ]
}
```

提醒规则：

- 仅返回当前时刻起 7×24 小时内到期的任务，最多 10 条。
- 仅包含 active 项目内状态为 `todo` 或 `doing` 的任务。
- 排除已完成、已过期、无截止时间以及 archived/deleted 项目任务。
- 按 `deadline ASC, id ASC` 排序。
- `days_left` 按剩余时长向上取整；不足 24 小时为 `1`，恰好到期为 `0`。Dashboard 中可继续按 `days_left <= 3` 判断紧急提醒。

### 8.3 前端接入注意事项

- 当前 `src/api/dashboard.ts` 只有类型定义，尚未提供请求函数；需要新增 `getDashboardStats()` 和 `getDashboardReminders()`。
- 后端保持项目统一的 snake_case 契约，而现有 Dashboard mock 类型使用 `parseJobs`、`activeProjects`、`openTasks`、`projectId`、`daysLeft`。建议在 API 层映射成现有视图模型，避免让 `DashboardView.vue` 同时处理两套命名。
- `DashboardView.vue` 接入后，统计卡片改用统计接口结果，“今日提醒”列表与顶部即将到期数量改用提醒接口的 `items`。
- `deadline` 为 ISO 8601 时间，列表展示前由前端统一格式化；不要直接依赖 mock 中的 `YYYY-MM-DD` 字符串格式。
- 本次接口不覆盖“最近解析记录”，该模块仍需使用历史接口或后续独立聚合接口接入。

⚠️ **缺口检查**：工作台统计与提醒后端接口已可用，但 `src/api/dashboard.ts` 和 `DashboardView.vue` 仍未联调，`mockStats`、`mockReminders` 仍在使用。

---

## 9. 枚举 ↔ 前端常量对照（务必对齐，避免标签错位）

| 枚举 | 取值 | 前端常量位置 |
|---|---|---|
| 文档 `source_type` | `pdf` / `text` | `src/constants/parseStatus.ts` 等（确认含 `DOCUMENT_SOURCE_LABEL`） |
| 文档 `status` | `uploaded` / `ready` / `failed` | 同上 |
| 解析任务 `status` | `pending` / `processing` / `success` / `failed` | `PARSE_STATUS_LABEL` / `PARSE_STATUS_TAG` |
| 项目 `status` | `active` / `archived` / `deleted` | 待补 |
| 任务 `status` | `todo` / `doing` / `done` | 待补 |
| 任务 `priority` | `low` / `medium` / `high` | 待补 |
| 任务 `source_type` | `ai` / `manual` | 待补 |

> 后端枚举若变更，必须同步前端常量；否则标签/颜色映射错位。

---

## 10. 联调前置清单（后端需给前端的）

- [x] `openapi.yaml`（接口契约，已具备）
- [x] 统一响应信封 + 鉴权/CSRF 说明（本文已汇总）
- [x] 本地服务地址与启动方式（`make run`，默认 `:8888`）
- [x] CORS 已放行 `http://localhost:5173` / `5174`
- [ ] **错误码语义表**：`pkg/errors/code.go` 中的业务 `code` 含义（如 `ErrRefreshTokenReused`、`ErrCacheUnavailable` 等），建议后端导出一份 Markdown 供前端判断跳转/提示。
- [ ] **枚举对照表**：见第 9 节，建议后端维护一份权威枚举清单。

---

## 11. 前端待办（联调前补齐）

1. **补齐 `src/api/dashboard.ts` 并替换工作台 mock**：接入第 8 节统计与提醒接口，在 API 层完成 snake_case 到现有驼峰视图模型的映射。
2. **新建 `src/api/task.ts`**：补齐第 6 节 5 个未封装的写接口（create/update/status/delete/reorder）。
3. **新建 `src/api/history.ts`**：补齐第 7 节 4 个只读历史接口。
4. **校验 `document.ts` 分页结构**：确认按 `{items,total,page,page_size}` 解析。
5. **补齐枚举常量**：项目/任务/优先级的 `LABEL` 与 `TAG`（颜色）映射（第 9 节）。
6. **乐观锁 409 处理**：`PUT` 解析结果/项目/任务返回 409 时，前端应重新拉取最新 `version` 后提示用户重试。

---

*文档生成依据：`taskpilot-server/docs/openapi.yaml` 与前端 `src/api/*`、`src/utils/storage.ts`、`src/api/client.ts`。如后端契约更新，请同步刷新本文件。*
