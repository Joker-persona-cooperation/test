// 账号相关接口，对接后端 /api/v1/auth 与 /api/v1/users
import { http } from './client'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  nickname: string
  email: string
  password: string
}

export interface UserProfile {
  id: number
  email: string
  nickname: string
  avatar_url?: string
}

export interface AuthResult {
  user: UserProfile
  access_token: string
  expires_in_sec: number
}

// 更新个人资料：nickname / avatar_url 至少提供其一。
// 该接口强制走 access/refresh Cookie + CSRF（见 docs/api-contract.md 0.2 节），
// client.ts 已全局带上 withCredentials 与 X-CSRF-Token 头，此处无需额外处理。
export interface UpdateProfileParams {
  nickname?: string
  avatar_url?: string | null
}

export function login(params: LoginParams): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/login', params)
}

export function register(params: RegisterParams): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/register', params)
}

export function fetchProfile(): Promise<UserProfile> {
  return http.get<UserProfile>('/users/me')
}

// 更新个人资料，成功返回新的 AuthResult（可能携带新 access token 与新 user），
// 调用方应使用返回结果刷新本地会话。
export function updateProfile(
  params: UpdateProfileParams,
): Promise<AuthResult> {
  return http.put<AuthResult>('/users/me', params)
}

// 这里故意不导出 refresh()：刷新必须由 client.ts 内部用原始 axios 实例发起，
// 若经 http.post 走一遍响应拦截，refresh 自身的 401 会再次触发刷新逻辑而死循环。
// 需要续期的场景不用手动调用，受保护接口 401 时请求层会自动刷新并重试。

export function logout(): Promise<void> {
  return http.post<void>('/auth/logout')
}
