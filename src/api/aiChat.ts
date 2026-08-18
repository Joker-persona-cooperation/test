import {
  notifySessionExpired,
  refreshAccessToken,
  type Envelope,
} from './client'
import { ApiError, RequestCanceledError, SessionExpiredError } from './errors'
import { getCsrfToken, getToken } from '@/utils/storage'
import { parseSseChunk } from '@/utils/sse'

export type AIChatRole = 'user' | 'assistant'

export interface AIChatContextMessage {
  role: AIChatRole
  content: string
}

export interface AIChatStreamHandlers {
  onMeta?: (data: { request_id: string; model: string }) => void
  onDelta: (content: string) => void
  onDone?: (data: { finish_reason: string }) => void
}

interface StreamErrorData {
  code: number
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export async function streamAIChat(
  parseResultId: number,
  messages: AIChatContextMessage[],
  signal: AbortSignal,
  handlers: AIChatStreamHandlers,
): Promise<void> {
  const requestId = crypto.randomUUID()
  let response = await openStream(parseResultId, messages, requestId, signal)

  if (response.status === 401) {
    await refreshAccessToken()
    response = await openStream(parseResultId, messages, requestId, signal)
  }
  if (response.status === 401) {
    throw notifySessionExpired(new SessionExpiredError())
  }
  if (!response.ok) {
    throw await readHttpError(response)
  }
  if (!response.body) {
    throw new ApiError('浏览器不支持流式响应')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const parsed = parseSseChunk(buffer)
      buffer = parsed.rest
      for (const event of parsed.events) {
        completed = handleEvent(event.event, event.data, handlers) || completed
      }
      if (done) break
    }
    if (!completed) throw new ApiError('AI 响应意外中断')
  } catch (error) {
    if (signal.aborted) throw new RequestCanceledError()
    throw error
  } finally {
    reader.releaseLock()
  }
}

function openStream(
  parseResultId: number,
  messages: AIChatContextMessage[],
  requestId: string,
  signal: AbortSignal,
) {
  const token = getToken()
  const csrf = getCsrfToken()
  return fetch(`${apiBaseUrl}/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Request-ID': requestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify({ parse_result_id: parseResultId, messages }),
  })
}

async function readHttpError(response: Response) {
  let body: Envelope<null> | null = null
  try {
    body = (await response.json()) as Envelope<null>
  } catch {
    // 非信封错误统一回退到 HTTP 状态文本。
  }
  const retryAfter = response.headers.get('Retry-After')
  const message =
    response.status === 429 && retryAfter
      ? `请求过于频繁，请 ${retryAfter} 秒后重试`
      : body?.message || response.statusText || 'AI 助手请求失败'
  return new ApiError(message, { status: response.status, code: body?.code })
}

function handleEvent(
  event: string,
  rawData: string,
  handlers: AIChatStreamHandlers,
): boolean {
  if (event === 'meta') {
    handlers.onMeta?.(
      JSON.parse(rawData) as { request_id: string; model: string },
    )
    return false
  }
  if (event === 'delta') {
    handlers.onDelta((JSON.parse(rawData) as { content: string }).content)
    return false
  }
  if (event === 'done') {
    handlers.onDone?.(JSON.parse(rawData) as { finish_reason: string })
    return true
  }
  if (event === 'error') {
    const data = JSON.parse(rawData) as StreamErrorData
    throw new ApiError(data.message, { code: data.code })
  }
  return false
}
