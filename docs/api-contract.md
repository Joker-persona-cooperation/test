# 前端接口契约（TaskPilot Web）

> 本文档面向前端联调。契约权威来源依次为后端 `internal/types`、handler/logic 的实际行为和 `taskpilot-server/docs/openapi.yaml`。
> 后端业务接口前缀统一为 `/api/v1`；前端 `src/api/client.ts` 已通过 `VITE_API_BASE_URL` 配置基础地址，API 模块只写相对路径。

## 0. 全局约定

### 0.1 统一响应信封

成功和失败都使用同一信封：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code === 0` 表示成功，前端 `http.get/post/put/patch/delete<T>()` 直接返回 `data`。
- `code !== 0` 表示业务失败，`data` 为 `null`，`client.ts` 会抛出 `ApiError`。
- 删除接口的成功响应当前为 `data: {}`，登出成功为 `data: null`；前端封装都可将其视为 `Promise<void>`。
- 本文的“必填/可选”描述请求 JSON 是否必须出现该字段；“nullable”表示允许显式传 `null` 或响应可能为 `null`。
- 后端带 `omitempty` 的响应字段在无值时会直接省略，不保证以 `null` 返回；前端类型应使用可选字段。

### 0.2 鉴权与刷新

- 注册、登录公开。
- 普通受保护接口优先使用 `Authorization: Bearer <access_token>`；缺少 Bearer 时后端可回退 access Cookie。
- `/auth/refresh`、`/auth/logout` 强制使用 refresh Cookie + `X-CSRF-Token`。
- `PUT /users/me` 强制使用 access/refresh Cookie + CSRF，不接受仅 Bearer 的调用方式。
- 受保护接口返回 `401` 时，`client.ts` 自动刷新并重试一次；refresh 明确返回 `401/403` 时抛出 `SessionExpiredError`，网络错误与 `5xx` 保留当前登录态并交由调用方重试。

### 0.3 常用状态码

| HTTP  | 语义                                     |
| ----- | ---------------------------------------- |
| `200` | 查询、更新、幂等操作成功                 |
| `201` | 首次创建成功                             |
| `400` | JSON、路径、查询参数或字段校验失败       |
| `401` | Access/Refresh Token 无效或过期          |
| `403` | CSRF 校验失败或无权执行                  |
| `404` | 资源不存在；跨用户访问也统一表现为 404   |
| `409` | 乐观锁、状态机、排序集合或并发冲突       |
| `413` | 请求体或上传文件过大                     |
| `422` | 资源当前状态不允许操作，或持久化快照非法 |
| `429` | 认证限流                                 |
| `503` | PostgreSQL、Redis 等依赖不可用           |

## 1. 认证与用户

| 方法 | 路径             | 请求 `data` 约束                     | 成功 `data`     | 前端封装             |
| ---- | ---------------- | ------------------------------------ | --------------- | -------------------- |
| POST | `/auth/register` | `nickname`、`email`、`password` 必填 | `AuthResult`    | `register`           |
| POST | `/auth/login`    | `email`、`password` 必填             | `AuthResult`    | `login`              |
| POST | `/auth/refresh`  | 无 JSON Body                         | 新 access token | `client.ts` 内部调用 |
| POST | `/auth/logout`   | 无 JSON Body                         | `null`          | `logout`             |
| GET  | `/users/me`      | 无                                   | `UserProfile`   | `fetchProfile`       |
| PUT  | `/users/me`      | `nickname`/`avatar_url` 至少一个     | 新 `AuthResult` | 尚未封装             |

注册约束：`nickname` 1–64 字符，`password` 至少 8 位，`email` 必须合法。后端对 email 执行 `trim + lower`。`avatar_url` 无值时响应可能省略该字段。

## 2. 文档 Documents

| 方法   | 路径                     | 请求约束                             | 成功 `data`    | 前端封装             |
| ------ | ------------------------ | ------------------------------------ | -------------- | -------------------- |
| POST   | `/documents/text`        | JSON：`title`、`text` 均必填         | `Document`     | `createTextDocument` |
| POST   | `/documents/pdf`         | multipart：`file` 必填，`title` 可选 | `Document`     | `createPdfDocument`  |
| GET    | `/documents`             | query：`page`、`page_size` 可选      | `DocumentList` | 尚未封装             |
| GET    | `/documents/:documentId` | 无                                   | `Document`     | `getDocument`        |
| DELETE | `/documents/:documentId` | 无                                   | `{}`           | 尚未封装             |

文本文档请求：

```json
{ "title": "比赛要求", "text": "请于 8 月 20 日前提交……" }
```

- `title` 必填，最多 255 个 Unicode 字符；后端不会根据正文自动生成标题。
- `text` 必填，最多 50,000 个 Unicode 字符；JSON 请求体最大 256 KiB。
- PDF 最大 10 MiB、50 页，必须包含可提取文字且不能加密；前端展示上传进度，上传完成后的同步提取阶段不提供百分比。
- `Document` 必定返回 `id`、`source_type`、`status`、`created_at`、`updated_at`。
- `title`、`file_name`、`file_url`、`page_count`、`file_size`、`content` 无值时可能省略。
- 列表 `data` 固定为 `{ items, page, page_size, total }`，列表项不包含 `content`。

## 3. 解析任务 Parse Jobs

| 方法 | 路径                                | 请求约束                   | 成功 `data`   | 前端封装            |
| ---- | ----------------------------------- | -------------------------- | ------------- | ------------------- |
| POST | `/parse-jobs`                       | `document_id` 必填且大于 0 | `ParseJob`    | `createParseJob`    |
| GET  | `/parse-jobs/:jobId`                | 无                         | `ParseJob`    | `getParseJob`       |
| POST | `/parse-jobs/:jobId/retry`          | 无 JSON Body               | `ParseJob`    | `retryParseJob`     |
| GET  | `/documents/:documentId/latest-job` | 无                         | `ParseJob`    | `getLatestParseJob` |
| GET  | `/parse-jobs/:jobId/result`         | 无                         | `ParseResult` | `getParseJobResult` |

创建请求只允许：

```json
{ "document_id": 1 }
```

`job_type` 由后端固定为 `ai_parse`，不是创建请求字段。`ParseJob` 必定返回 `job_type` 和 `retry_count`；`error_message`、`started_at`、`finished_at` 无值时可能省略。

## 4. 解析结果 Parse Results

| 方法 | 路径                               | 请求约束                        | 成功 `data`            | 前端封装                |
| ---- | ---------------------------------- | ------------------------------- | ---------------------- | ----------------------- |
| GET  | `/parse-results/:resultId`         | 无                              | `ParseResult`          | 尚未封装                |
| PUT  | `/parse-results/:resultId`         | 见下表                          | 更新后的 `ParseResult` | `updateParseResult`     |
| POST | `/parse-results/:resultId/confirm` | 无 JSON Body                    | 已确认的 `ParseResult` | `confirmParseResult`    |
| GET  | `/history/parse-results`           | query：`page`、`page_size` 可选 | 分页结果               | `getParseResultHistory` |

`PUT` 字段约束：

| 字段               | 必填 | nullable | 约束                                         |
| ------------------ | ---: | -------: | -------------------------------------------- |
| `version`          |   是 |       否 | `>= 1`，陈旧版本返回 409                     |
| `title`            |   是 |       否 | 1–255 字符                                   |
| `summary`          |   是 |       否 | 1–5000 字符                                  |
| `deadline`         |   否 |       是 | ISO 8601 时间；省略与 `null` 均表示清空      |
| `deliverables`     |   是 |       否 | 数组，最多 50 项；允许空数组，不允许 `null`  |
| `key_requirements` |   是 |       否 | 数组，最多 100 项；允许空数组，不允许 `null` |
| `risk_warnings`    |   是 |       否 | 数组，最多 50 项；允许空数组，不允许 `null`  |
| `generated_tasks`  |   是 |       否 | 数组，最多 100 项；允许空数组，不允许 `null` |

`generated_tasks[]` 中：`title` 必填；`description`、`priority`、`deadline` 可选；`description`/`deadline` 可为 `null`；省略 `priority` 时后端归一化为 `medium`。

确认接口不接收 `version`，也不会执行解析结果内容编辑；它是幂等操作。只有 `PUT` 使用 `version` 乐观锁。

## 5. 项目 Projects

| 方法   | 路径                             | 请求约束                            | 成功 `data`          | 前端封装           |
| ------ | -------------------------------- | ----------------------------------- | -------------------- | ------------------ |
| POST   | `/projects`                      | `parse_result_id`、`name` 必填      | `{ project, tasks }` | `createProject`    |
| GET    | `/projects`                      | `status` 可选，仅 `active/archived` | 分页项目             | `getProjects`      |
| GET    | `/projects/:projectId`           | 无                                  | `Project`            | `getProject`       |
| PUT    | `/projects/:projectId`           | `version`、`name` 必填              | 更新后的 `Project`   | `updateProject`    |
| POST   | `/projects/:projectId/archive`   | 无 JSON Body                        | `Project`            | `archiveProject`   |
| POST   | `/projects/:projectId/unarchive` | 无 JSON Body                        | `Project`            | `unarchiveProject` |
| DELETE | `/projects/:projectId`           | 无                                  | `{}`                 | `deleteProject`    |

- `POST /projects` 首次创建返回 201；相同解析结果重复请求返回既有项目和任务并使用 200。
- `name` 1–255 字符。创建请求只接受 `parse_result_id` 和 `name`。
- `PUT` 中 `description`、`deadline` 可选且 nullable；当前完整更新语义下，省略与传 `null` 都会清空对应字段。
- `Project.source_document_id` 是必定返回的非空整数，不需要前端补 `null`。
- `Project.description`、`Project.deadline` 是必定出现的字段，无值时显式返回 `null`。

## 6. 任务 Tasks

### 6.1 接口

| 方法   | 路径                         | 请求约束                               | 成功 `data` | 前端封装           |
| ------ | ---------------------------- | -------------------------------------- | ----------- | ------------------ |
| GET    | `/projects/:projectId/tasks` | query `status` 可选：`todo/doing/done` | `{ items }` | `getProjectTasks`  |
| POST   | `/projects/:projectId/tasks` | `title`、`priority` 必填               | `Task`      | `createTask`       |
| PUT    | `/tasks/:taskId`             | `version`、`title`、`priority` 必填    | `Task`      | `updateTask`       |
| PATCH  | `/tasks/:taskId/status`      | `status` 必填                          | `Task`      | `updateTaskStatus` |
| DELETE | `/tasks/:taskId`             | 无                                     | `{}`        | `deleteTask`       |
| POST   | `/tasks/reorder`             | `project_id`、`task_ids` 必填          | `{ items }` | `reorderTasks`     |

### 6.2 创建与完整编辑字段

| 字段          | 创建 POST | 编辑 PUT | nullable | 约束/语义                         |
| ------------- | --------: | -------: | -------: | --------------------------------- |
| `version`     |    不允许 |     必填 |       否 | `>= 1`；仅 PUT 使用，冲突返回 409 |
| `title`       |      必填 |     必填 |       否 | trim 后 1–255 字符                |
| `priority`    |      必填 |     必填 |       否 | `low/medium/high`                 |
| `description` |      可选 |     可选 |       是 | 非空时最多 2000 字符              |
| `deadline`    |      可选 |     可选 |       是 | ISO 8601 时间                     |

关键语义：

- 创建时省略 `description`/`deadline` 与传 `null` 等价。
- PUT 是任务内容的完整编辑；省略 `description`/`deadline` 与传 `null` 都会清空字段。前端编辑表单应提交当前完整值。
- `status`、`sort_order`、`source_type`、`source_parse_result_id` 均不是创建/PUT 字段；任务 handler 使用严格 JSON 绑定，多传未知字段返回 400。
- 手动创建固定生成 `status=todo`、`source_type=manual`、`source_parse_result_id=null`，并追加到项目末尾。
- 更新状态只发送 `{ "status": "todo|doing|done" }`，重复设置同一状态幂等。
- 排序必须发送项目当前完整任务 ID 集合；`task_ids: []` 仅在项目本来就没有任务时合法。

### 6.3 Task 响应字段

`Task` 必定包含以下全部字段：

```json
{
  "id": 1,
  "project_id": 1,
  "source_parse_result_id": null,
  "title": "提交说明书",
  "description": null,
  "status": "todo",
  "priority": "medium",
  "deadline": null,
  "sort_order": 0,
  "source_type": "manual",
  "version": 1,
  "created_at": "2026-08-04T10:00:00Z",
  "updated_at": "2026-08-04T10:00:00Z"
}
```

- 排序字段的唯一契约名是 `sort_order`，不存在 `order_index`。
- `source_parse_result_id`、`description`、`deadline` 必定出现但允许为 `null`。
- `source_type=ai` 表示保存项目时从解析快照生成；`manual` 表示项目内手动新增。
- 项目创建后 `tasks` 表是唯一任务真相源，任务写操作不得回写 `parse_results.generated_tasks`。

## 7. 工作台与历史

| 方法 | 路径                                 | 成功 `data`                                                            | 前端状态                       |
| ---- | ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------ |
| GET  | `/dashboard/stats`                   | `{ documents, parse_jobs, active_projects, open_tasks }`               | 仅有驼峰视图类型，尚未封装请求 |
| GET  | `/dashboard/reminders`               | `{ items: [{ id, project_id, title, project, deadline, days_left }] }` | 仅有驼峰视图类型，尚未封装请求 |
| GET  | `/history/projects`                  | 分页全状态项目                                                         | 尚未封装                       |
| GET  | `/history/projects/:projectId`       | 历史项目详情                                                           | 尚未封装                       |
| GET  | `/history/projects/:projectId/tasks` | `{ items }`                                                            | 尚未封装                       |
| GET  | `/history/parse-results`             | 分页解析结果                                                           | 已封装                         |

Dashboard 当前视图类型使用 camelCase，而后端响应固定使用 snake_case。未来接入 Dashboard 时，在 API 边界做一次明确的 DTO → ViewModel 映射是合理的；项目和任务 API 的字段名已经与视图模型一致，不需要同类归一化。

## 8. 当前契约审查结论

- `Project`/`Task` 后端响应字段稳定且与 TypeScript 类型一致，不保留 `RawProject`、`RawTask` 或 `normalizeProject/normalizeTask` 兼容层。
- 不兼容不存在的 `order_index`；契约只认 `sort_order`，缺失应作为后端契约错误暴露，而不是静默回退为 0。
- 前端请求类型已按后端校验区分必填与可选字段，尤其是任务创建/编辑的 `title`、`priority`、`version` 约束。
- 前端文本文档页已按后端真实行为要求标题必填，不再宣称留空后端自动生成。
- 未封装接口属于功能覆盖缺口，不等同于已封装接口的契约偏移；新增页面联调时应按本文件补齐。

---

_最后核对：2026-08-04。后端契约变更时，应同步更新 `taskpilot-server/docs/openapi.yaml`、后端 DTO/测试、前端 API 类型和本文档。_
