// 请求层对外的错误契约。
//
// 响应拦截会把 AxiosError 与业务码失败统一包装成这里的类型：调用方拿到的
// 不再是 AxiosError，所以判断失败原因必须用 isApiError / isSessionExpired，
// 不要再用 axios 的 isAxiosError（包装后恒为 false）。
export class ApiError extends Error {
  /** HTTP 状态码，网络层面失败（超时、断网）时为 undefined */
  readonly status?: number
  /** 后端信封里的业务码，非信封错误时为 undefined */
  readonly code?: number

  constructor(
    message: string,
    options: { status?: number; code?: number } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
  }
}

/**
 * 会话确实失效：refresh 失败，或刷新重试后仍然 401。
 *
 * 请求层只负责抛出它，不负责清本地态、不负责跳登录——那是 store 与 router
 * 的职责。跳转链路见 `setSessionExpiredHandler`。
 */
export class SessionExpiredError extends ApiError {
  constructor(message = '会话已失效，请重新登录') {
    super(message, { status: 401 })
    this.name = 'SessionExpiredError'
  }
}

export class RequestCanceledError extends Error {
  constructor(message = '请求已取消') {
    super(message)
    this.name = 'RequestCanceledError'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isSessionExpired(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError
}

export function isRequestCanceled(
  error: unknown,
): error is RequestCanceledError {
  return error instanceof RequestCanceledError
}
