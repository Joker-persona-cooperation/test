import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, setToken, getCsrfToken } from '@/utils/storage'
import { ApiError, RequestCanceledError, SessionExpiredError } from './errors'

// 后端统一响应信封：{ code, message, data }
export interface Envelope<T> {
  code: number
  message: string
  data: T
}

const PUBLIC_PATHS = ['/login', '/register']
const REFRESH_URL = '/auth/refresh'

// 会话失效时的善后动作由上层注入（main.ts 里绑定 store.clearSession + router.push）。
// 请求层不 import stores/ 与 router：一是避免 api → stores → api 的循环依赖，
// 二是保证请求层可以脱离 Vue 运行时单测。
type SessionExpiredHandler = (error: SessionExpiredError) => void

let onSessionExpired: SessionExpiredHandler | null = null

export function setSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler
}

export function notifySessionExpired(error: SessionExpiredError) {
  onSessionExpired?.(error)
  return error
}

const clientConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15000,
  withCredentials: true,
}

const request = axios.create(clientConfig)

// refresh 使用独立实例，避免进入普通响应拦截器后重复触发会话失效通知。
const refreshRequest = axios.create(clientConfig)

// 请求拦截：注入 Bearer 与 CSRF 头
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const csrf = getCsrfToken()
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf
  }
  return config
})

// 无感刷新：受保护接口 401 时用 refresh cookie 换新 access token 并重试，
// 并发 401 共享同一个 refresh Promise，避免重复轮换 refresh token
let refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const csrf = getCsrfToken()
  const response = await refreshRequest.post<
    Envelope<{ access_token: string; expires_in_sec: number }>
  >(REFRESH_URL, undefined, {
    headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
  })
  const body = response.data
  if (body.code !== 0) {
    throw new ApiError(body.message || '刷新会话失败', {
      status: response.status,
      code: body.code,
    })
  }
  const token = body.data?.access_token
  if (!token) {
    throw new ApiError('刷新会话失败', { status: response.status })
  }
  setToken(token)
  return token
}

function normalizeRefreshError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return new SessionExpiredError()
    }
    return error
  }
  if (axios.isAxiosError<Envelope<unknown>>(error)) {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      return new SessionExpiredError()
    }
    const message =
      error.response?.data?.message || error.message || '刷新会话失败'
    return new ApiError(message, {
      status,
      code: error.response?.data?.code,
    })
  }
  return new ApiError(
    error instanceof Error ? error.message : '刷新会话失败',
  )
}

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefresh()
    .catch((error: unknown) => {
      const normalized = normalizeRefreshError(error)
      if (normalized instanceof SessionExpiredError) {
        throw notifySessionExpired(normalized)
      }
      ElMessage.error(normalized.message)
      throw normalized
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

// 响应拦截：统一处理业务码与 401 无感刷新
request.interceptors.response.use(
  (response: AxiosResponse<Envelope<unknown>>) => {
    const body = response.data
    if (body && typeof body.code === 'number' && body.code !== 0) {
      const msg = body.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(
        new ApiError(msg, { status: response.status, code: body.code }),
      )
    }
    return response
  },
  async (error: AxiosError<Envelope<unknown>>) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new RequestCanceledError())
    }

    const status = error.response?.status
    const original = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const url = original?.url || ''
    const isRefreshCall = url.includes(REFRESH_URL)
    const isPublicCall = PUBLIC_PATHS.some((p) => url.includes(p))

    // refresh 自身失败 或 公开接口 401：不再刷新，直接提示 / 交给上层跳登录
    if (isRefreshCall || isPublicCall) {
      const msg = error.response?.data?.message || error.message || '网络异常'
      if (status === 401 && isRefreshCall) {
        return Promise.reject(notifySessionExpired(new SessionExpiredError()))
      }
      ElMessage.error(msg)
      return Promise.reject(
        new ApiError(msg, { status, code: error.response?.data?.code }),
      )
    }

    // 受保护接口 401：尝试无感刷新后重试一次
    if (status === 401 && original && !original._retried) {
      original._retried = true

      const newToken = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${newToken}`
      return request(original)
    }

    const msg = error.response?.data?.message || error.message || '网络异常'
    if (status === 401) {
      // 重试后仍 401：会话确实失效，交给上层清理并跳登录
      return Promise.reject(notifySessionExpired(new SessionExpiredError()))
    }
    ElMessage.error(msg)
    return Promise.reject(
      new ApiError(msg, { status, code: error.response?.data?.code }),
    )
  },
)

// 类型友好的请求方法：直接返回信封内的 data
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get<Envelope<T>>(url, config).then((r) => r.data.data)
  },
  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request.post<Envelope<T>>(url, data, config).then((r) => r.data.data)
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return request.put<Envelope<T>>(url, data, config).then((r) => r.data.data)
  },
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request
      .patch<Envelope<T>>(url, data, config)
      .then((r) => r.data.data)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete<Envelope<T>>(url, config).then((r) => r.data.data)
  },
}

export default request
