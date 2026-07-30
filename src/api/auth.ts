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

export function login(params: LoginParams): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/login', params)
}

export function register(params: RegisterParams): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/register', params)
}

export function fetchProfile(): Promise<UserProfile> {
  return http.get<UserProfile>('/users/me')
}

export function refresh(): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/refresh')
}

export function logout(): Promise<void> {
  return http.post<void>('/auth/logout')
}
