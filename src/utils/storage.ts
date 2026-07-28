// 本地持久化工具：登录态 token 与用户信息存到 localStorage
const TOKEN_KEY = 'taskpilot_token'
const USER_KEY = 'taskpilot_user'

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
