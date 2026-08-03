# 错误码语义表 & 枚举对照表（TaskPilot 前后端联调）

> 错误码来源：后端 `taskpilot-server/pkg/errors/code.go`（权威）。
> 枚举来源：后端 `scripts/migrate.sql` 的 CHECK 约束 + 前端 `src/constants/parseStatus.ts`（已实现部分）。
> 本文档为前端联调对接使用，后端若增删错误码 / 枚举值，请同步刷新本文件。

---

## 一、错误码语义表

后端所有接口（成功与失败）都返回统一信封 `{ code, message, data }`。**`code === 0` 成功；非 0 为业务错误**，此时 `message` 通常为中文可读提示，`data` 为 `null`。

前端 `client.ts` 已统一处理：非 0 时构造 `ApiError(code, message)` 并 `reject`，同时 `ElMessage.error(message)`。因此下表主要用于**前端按 `code` 做差异化分支**（如强制登出、重试、限流提示等）。

| code | 常量名 | HTTP 关联 | 语义 | 前端建议动作 |
|---|---|---|---|---|
| 0 | `CodeOK` | 200 | 成功 | 取 `data` |
| 10001 | `CodeBadRequest` | 400 | 参数校验失败 / 请求体非法 | 弹 `message`；表单场景可定位到字段 |
| 10002 | `CodeUnauthorized` | 401 | 未登录 / access token 失效 | 触发无感刷新；刷新失败跳登录（见 `SessionExpiredError`） |
| 10003 | `CodeEmailRegistered` | 409* | 邮箱已被注册 | 注册表单提示「该邮箱已注册」，引导去登录 |
| 10004 | `CodeDatabaseUnavailable` | 503 | 数据库不可用 | 弹「服务暂不可用，请稍后重试」 |
| 10005 | `CodeInternalError` | 500 | 服务器内部错误 | 弹 `message`；上报日志 |
| 10006 | `CodeNotFound` | 404 | 资源不存在（文档/任务/项目/结果等） | 弹 `message`；列表页可刷新；详情页可回退 |
| 10007 | `CodeConflict` | 409 | 并发冲突 / 幂等冲突 / 版本冲突 | 弹 `message`；**先重新拉取最新数据（含 `version`）再提示用户重试**（乐观锁 409） |
| 10008 | `CodeInvalidState` | 409* | 状态机非法流转（如对非 active 项目编辑、重复确认/归档） | 弹 `message`；刷新当前实体状态 |
| 10009 | `CodePayloadTooLarge` | 413 | 请求体过大（文本超长等） | 提示用户精简内容或分段 |
| 10010 | `CodeServiceUnavailable` | 503 | 依赖服务不可用（如 Redis / AI 未就绪，对应 `ErrCacheUnavailable`） | 弹「服务暂不可用」；若是 AI 解析相关，提示稍后重试 |
| 10011 | `CodeForbidden` | 403 | 无权限 / CSRF 校验失败 | 弹 `message`；若是 CSRF 失败，检查 `X-CSRF-Token` 是否随 Cookie 带出 |
| 10012 | `CodeUnsupportedFileType` | 400* | 不支持的文件类型（上传非 PDF） | 提示「仅支持 PDF」 |
| 10013 | `CodePDFUnprocessable` | 422* | PDF 无法解析（损坏 / 加密 / 无文本层） | 提示用户更换文件或改用「粘贴文本」 |
| 10014 | `CodeTooManyRequests` | 429 | 触发限流（后端限流尚未接入，预期未来启用） | 弹「操作过于频繁，请稍后再试」 |

> 注：带 `*` 的 HTTP 关联为**预期映射**（依据语义推断），具体以运行后端实际返回为准；后端目前部分接口可能仍用 400/409 承载，建议联调时以 `code` 字段为准，而非仅依赖 HTTP 状态码。

### 前端差异化分支建议（示例）
```ts
import { ApiError } from '@/api/errors'   // 如未抽出，按 client.ts 实际导出名

if (err instanceof ApiError) {
  switch (err.code) {
    case 10002: /* 已由 client.ts 无感刷新处理，一般无需额外动作 */ break
    case 10003: ElMessage.warning('该邮箱已注册，请直接登录'); break
    case 10004:
    case 10010: ElMessage.error('服务暂不可用，请稍后重试'); break
    case 10007: /* 乐观锁冲突 */ await reloadLatest(); ElMessage.warning('数据已被修改，请重试'); break
    case 10008: await reloadEntity(); ElMessage.warning('当前状态不允许该操作'); break
    case 10011: ElMessage.error('操作被拒绝，请刷新页面'); break
    case 10012: ElMessage.error('仅支持 PDF 文件'); break
    case 10013: ElMessage.error('PDF 无法解析，请检查文件或更换为文本'); break
    case 10014: ElMessage.warning('操作过于频繁，请稍后再试'); break
    default: ElMessage.error(err.message)
  }
}
```

---

## 二、枚举对照表

后端枚举来自 `scripts/migrate.sql` 的 CHECK 约束；前端常量集中在 `src/constants/parseStatus.ts`（**目前仅覆盖文档来源与解析任务状态**）。下方逐域列出，并标注前端实现状态。

### 2.1 文档 `documents`
| 字段 | 取值 | 中文 | 前端常量 | 状态 |
|---|---|---|---|---|
| `source_type` | `pdf` | PDF | `DOCUMENT_SOURCE_LABEL.pdf` | ✅ 已实现 |
| | `text` | 文本 | `DOCUMENT_SOURCE_LABEL.text` | ✅ 已实现 |
| `status` | `uploaded` | 已上传 | — | ❌ 缺 LABEL/TAG |
| | `ready` | 就绪 | — | ❌ 缺 |
| | `failed` | 失败 | — | ❌ 缺 |

> 说明：`parseStatus.ts` 只定义了 `DocumentSource` 类型与 `DOCUMENT_SOURCE_LABEL`，**文档 `status` 尚无映射**（列表/详情页若展示需补 `DOCUMENT_STATUS_LABEL` / `DOCUMENT_STATUS_TAG`）。

### 2.2 解析任务 `parse_jobs`
| 字段 | 取值 | 中文 | 颜色(TagType) | 前端常量 | 状态 |
|---|---|---|---|---|---|
| `job_type` | `ai_parse` | AI 解析 | — | — | ❌ 缺（目前仅 1 种，可暂不映射） |
| `status` | `pending` | 待处理 | `info` | `PARSE_STATUS_LABEL`/`PARSE_STATUS_TAG` | ✅ 已实现 |
| | `processing` | 解析中 | `warning` | 同上 | ✅ 已实现 |
| | `success` | 已完成 | `success` | 同上 | ✅ 已实现 |
| | `failed` | 失败 | `danger` | 同上 | ✅ 已实现 |

### 2.3 解析结果 `parse_results`
| 字段 | 取值 | 说明 | 前端常量 | 状态 |
|---|---|---|---|---|
| `is_confirmed` | `true`/`false` | 是否已确认 | — | ❌ 缺（建议 `CONFIRM_LABEL`） |
| `version` | 整数 ≥1 | 乐观锁版本 | — | 逻辑已用，无展示映射需求 |

> `deliverables` / `key_requirements` / `risk_warnings` / `generated_tasks` 均为 `jsonb`，结构由前端按业务自定义，无枚举。

### 2.4 项目 `projects`
| 字段 | 取值 | 中文 | 颜色 | 前端常量 | 状态 |
|---|---|---|---|---|---|
| `status` | `active` | 进行中 | — | — | ❌ 缺 `PROJECT_STATUS_LABEL`/`TAG` |
| | `archived` | 已归档 | — | — | ❌ 缺 |
| | `deleted` | 已删除 | — | — | ❌ 缺（前端通常不展示，仅逻辑态） |

### 2.5 任务 `tasks`
| 字段 | 取值 | 中文 | 颜色 | 前端常量 | 状态 |
|---|---|---|---|---|---|
| `status` | `todo` | 待办 | — | — | ❌ 缺 `TASK_STATUS_LABEL`/`TAG` |
| | `doing` | 进行中 | — | — | ❌ 缺 |
| | `done` | 已完成 | — | — | ❌ 缺 |
| `priority` | `low` | 低 | — | — | ❌ 缺 `TASK_PRIORITY_LABEL`/`TAG` |
| | `medium` | 中 | — | — | ❌ 缺 |
| | `high` | 高 | — | — | ❌ 缺 |
| `source_type` | `ai` | AI 生成 | — | — | ❌ 缺（保存项目时由快照展开） |
| | `manual` | 手动新增 | — | — | ❌ 缺 |

### 2.6 用户 `users`
| 字段 | 取值 | 说明 | 前端常量 | 状态 |
|---|---|---|---|---|
| `status` | `1`（默认） | 启用 | — | 单值，前端无需映射 |

---

## 三、前端待补枚举清单（联调前）

在 `src/constants/` 下建议新增 `project.ts` 与 `task.ts`（或并入 `parseStatus.ts`），补齐以下映射：

```ts
// src/constants/project.ts
export type ProjectStatus = 'active' | 'archived' | 'deleted'
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: '进行中', archived: '已归档', deleted: '已删除',
}
export const PROJECT_STATUS_TAG: Record<ProjectStatus, TagType> = {
  active: 'success', archived: 'info', deleted: 'danger',
}
```

```ts
// src/constants/task.ts
export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskSource = 'ai' | 'manual'
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '待办', doing: '进行中', done: '已完成',
}
export const TASK_STATUS_TAG: Record<TaskStatus, TagType> = {
  todo: 'info', doing: 'warning', done: 'success',
}
export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '低', medium: '中', high: '高',
}
export const TASK_PRIORITY_TAG: Record<TaskPriority, TagType> = {
  low: 'info', medium: '', high: 'danger',
}
export const TASK_SOURCE_LABEL: Record<TaskSource, string> = {
  ai: 'AI 生成', manual: '手动',
}
```

并补 `documents.status` 与 `parse_results.is_confirmed` 的映射。

---

*权威来源：后端 `pkg/errors/code.go` 与 `scripts/migrate.sql`；前端现状见 `src/constants/parseStatus.ts`。如后端变更，请同步更新本文件与 `docs/api-contract.md`。*
