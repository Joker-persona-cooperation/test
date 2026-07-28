// 账号相关接口。当前为模拟实现（无后端即可演示）；
// 接入真实后端时，把 login/register 内部替换为 request.post(...) 即可。
import request from './index'

export interface LoginParams {
  email: string
  password: string
}
export interface RegisterParams {
  nickname: string
  email: string
  password: string
}
export interface UserInfo {
  id: string
  nickname: string
  email: string
}
export interface AuthResult {
  token: string
  user: UserInfo
}

// 模拟接口返回（仅用于开发预览，后端就绪后删除）
function mockAuth(params: { email: string; password?: string; nickname?: string }): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!params.email || (params.password !== undefined && params.password.length < 8)) {
        reject(new Error('邮箱或密码错误'))
        return
      }
      resolve({
        token: 'mock-token-' + Date.now(),
        user: {
          id: 'u_' + Date.now(),
          nickname: params.nickname || params.email.split('@')[0],
          email: params.email,
        },
      })
    }, 800)
  })
}

export function login(params: LoginParams): Promise<AuthResult> {
  // 真实实现示例：
  // return request.post<AuthResult>('/auth/login', params).then(res => res.data)
  return mockAuth(params)
}

export function register(params: RegisterParams): Promise<AuthResult> {
  return mockAuth(params)
}
