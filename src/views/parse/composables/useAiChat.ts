import { computed, onBeforeUnmount, ref } from 'vue'
import { streamAIChat, type AIChatContextMessage } from '@/api/aiChat'
import { isRequestCanceled } from '@/api/errors'

export type AIChatMessageState = 'complete' | 'streaming' | 'stopped' | 'failed'

export interface AIChatMessage extends AIChatContextMessage {
  id: string
  state: AIChatMessageState
  error?: string
  contextEligible: boolean
}

export function useAiChat(parseResultId: () => number | undefined) {
  const messages = ref<AIChatMessage[]>([])
  const generating = ref(false)
  const model = ref('')
  let controller: AbortController | null = null

  const contextMessages = computed<AIChatContextMessage[]>(() => {
    const context = messages.value
      .filter((message) => message.contextEligible)
      .slice(-16)
      .map(({ role, content }) => ({ role, content }))
    let totalCharacters = context.reduce(
      (total, message) => total + Array.from(message.content).length,
      0,
    )
    while (totalCharacters > 10000 && context.length >= 2) {
      const removed = context.splice(0, 2)
      totalCharacters -= removed.reduce(
        (total, message) => total + Array.from(message.content).length,
        0,
      )
    }
    return context
  })

  async function send(question: string) {
    const resultId = parseResultId()
    const content = question.trim()
    if (!resultId || !content || generating.value) return

    const requestMessages: AIChatContextMessage[] = [
      ...contextMessages.value,
      { role: 'user', content },
    ]
    const userMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      state: 'complete',
      contextEligible: false,
    }
    const assistantMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      state: 'streaming',
      contextEligible: false,
    }
    messages.value.push(userMessage, assistantMessage)
    const userMessageIndex = messages.value.length - 2
    const assistantMessageIndex = messages.value.length - 1
    generating.value = true
    controller = new AbortController()
    let pendingOutput = ''
    let outputTimer: ReturnType<typeof setTimeout> | null = null
    let resolveOutputDrain: (() => void) | null = null

    const drainOutput = () => {
      outputTimer = null
      const characters = Array.from(pendingOutput)
      if (!characters.length) {
        resolveOutputDrain?.()
        resolveOutputDrain = null
        return
      }
      const count = Math.min(3, Math.max(1, Math.ceil(characters.length / 40)))
      messages.value[assistantMessageIndex].content += characters
        .slice(0, count)
        .join('')
      pendingOutput = characters.slice(count).join('')
      outputTimer = setTimeout(drainOutput, 24)
    }

    const scheduleOutput = () => {
      if (outputTimer === null) outputTimer = setTimeout(drainOutput, 0)
    }

    const waitForOutputDrain = () => {
      if (!pendingOutput && outputTimer === null) return Promise.resolve()
      return new Promise<void>((resolve) => {
        resolveOutputDrain = resolve
      })
    }

    try {
      await streamAIChat(resultId, requestMessages, controller.signal, {
        onMeta: (data) => {
          model.value = data.model
        },
        onDelta: (delta) => {
          pendingOutput += delta
          scheduleOutput()
        },
      })
      await waitForOutputDrain()
      messages.value[userMessageIndex].contextEligible = true
      messages.value[assistantMessageIndex].state = 'complete'
      messages.value[assistantMessageIndex].contextEligible = true
    } catch (error) {
      if (isRequestCanceled(error)) {
        messages.value[assistantMessageIndex].state = 'stopped'
      } else {
        messages.value[assistantMessageIndex].state = 'failed'
        messages.value[assistantMessageIndex].error =
          error instanceof Error ? error.message : 'AI 助手请求失败'
      }
    } finally {
      if (outputTimer !== null) clearTimeout(outputTimer)
      generating.value = false
      controller = null
    }
  }

  function stop() {
    controller?.abort()
  }

  async function retry(messageId: string) {
    const index = messages.value.findIndex(
      (message) => message.id === messageId,
    )
    if (index < 1 || messages.value[index].role !== 'assistant') return
    const question = messages.value[index - 1]
    messages.value.splice(index - 1, 2)
    await send(question.content)
  }

  function clear() {
    stop()
    messages.value = []
    model.value = ''
  }

  onBeforeUnmount(clear)

  return { messages, generating, model, send, stop, retry, clear }
}
