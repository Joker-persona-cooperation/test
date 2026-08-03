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
  return raw ? (JSON.parse(raw) as T) : null
}

export function setUser(user: unknown): void {
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
