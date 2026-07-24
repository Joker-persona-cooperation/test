import axios from 'axios'

// 不同环境读取对应的 VITE_API_BASE_URL（见 .env.development / .env.production）
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

export default api
