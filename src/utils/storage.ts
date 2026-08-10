// 本地持久化工具：access token 与用户信息存 localStorage；CSRF 从 cookie 读取
const TOKEN_KEY = 'taskpilot_token'
const USER_KEY = 'taskpilot_user'
const CSRF_COOKIE = 'csrf_token'
const SAVED_CREDENTIALS_KEY = 'taskpilot_saved_credentials'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser<T = unknown>(): T | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    // 清理历史脏数据（如之前误写入的字符串 "undefined"），避免阻塞应用启动
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setUser(user: unknown): void {
  // JSON.stringify(undefined) 返回 undefined，localStorage 会落成字符串
  // "undefined"，导致下次读取时 JSON.parse 抛错，这里统一清理而不是写入。
  if (user === undefined) {
    removeUser()
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY)
}

// 后端将 CSRF token 写入非 HttpOnly cookie，写请求（refresh/logout）需回填到请求头
export function getCsrfToken(): string {
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + CSRF_COOKIE + '=([^;]+)'),
  )
  return match ? decodeURIComponent(match[1]) : ''
}

// 记住密码：持久化邮箱与密码，下次登录自动回填（明文存储，仅在本地可信环境使用）
export interface SavedCredentials {
  email: string
  password: string
}

export function getSavedCredentials(): SavedCredentials | null {
  const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SavedCredentials
    if (
      parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.password === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function setSavedCredentials(email: string, password: string): void {
  localStorage.setItem(
    SAVED_CREDENTIALS_KEY,
    JSON.stringify({ email, password } satisfies SavedCredentials),
  )
}

export function clearSavedCredentials(): void {
  localStorage.removeItem(SAVED_CREDENTIALS_KEY)
}
