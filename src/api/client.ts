import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, setToken, getCsrfToken } from '@/utils/storage'
import { ApiError, SessionExpiredError } from './errors'

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

function notifySessionExpired(error: SessionExpiredError) {
  onSessionExpired?.(error)
  return error
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15000,
  withCredentials: true,
})

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
// 并发 401 只刷新一次，其余请求排队等待结果
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function flushQueue(token: string | null, err: unknown | null) {
  pendingQueue.forEach((p) => {
    if (token) p.resolve(token)
    else p.reject(err)
  })
  pendingQueue = []
}

async function doRefresh(): Promise<string> {
  // 用原始实例发起 refresh，避免再走响应拦截的 401 刷新逻辑造成循环
  const res =
    await request.post<
      Envelope<{ access_token: string; expires_in_sec: number }>
    >(REFRESH_URL)
  const token = res.data?.data?.access_token
  if (!token) throw new Error('刷新会话失败')
  setToken(token)
  return token
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

      // 已有刷新在进行：挂到队列等待新 token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(request(original))
            },
            reject,
          })
        })
      }

      isRefreshing = true
      try {
        const newToken = await doRefresh()
        flushQueue(newToken, null)
        original.headers.Authorization = `Bearer ${newToken}`
        return request(original)
      } catch {
        // refresh 失败：唤醒排队请求让它们一起失败，再通知上层清会话
        const expired = new SessionExpiredError()
        flushQueue(null, expired)
        return Promise.reject(notifySessionExpired(expired))
      } finally {
        isRefreshing = false
      }
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
