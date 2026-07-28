// 本地持久化工具：access token 与用户信息存 localStorage；CSRF 从 cookie 读取
const TOKEN_KEY = 'taskpilot_token'
const USER_KEY = 'taskpilot_user'
const CSRF_COOKIE = 'csrf_token'
const LAST_EMAIL_KEY = 'taskpilot_last_email'

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

// 记住登录邮箱：退出登录后保留，下次登录仅需输入密码
export function getLastEmail(): string {
  return localStorage.getItem(LAST_EMAIL_KEY) || ''
}

export function setLastEmail(email: string): void {
  localStorage.setItem(LAST_EMAIL_KEY, email)
}

export function clearLastEmail(): void {
  localStorage.removeItem(LAST_EMAIL_KEY)
}
