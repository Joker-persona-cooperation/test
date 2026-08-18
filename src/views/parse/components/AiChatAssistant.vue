<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ChatDotRound,
  Close,
  Promotion,
  RefreshRight,
  VideoPause,
} from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { useAiChat } from '../composables/useAiChat'

const props = defineProps<{ parseResultId: number }>()

const open = ref(false)
const question = ref('')
const messageList = ref<HTMLElement | null>(null)
const followOutput = ref(true)
const { messages, generating, model, send, stop, retry } = useAiChat(
  () => props.parseResultId,
)

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const quickQuestions = [
  '这份文档最容易遗漏什么？',
  '建议我优先完成哪些任务？',
  '当前有哪些截止时间风险？',
]

async function submit(content = question.value) {
  const normalized = content.trim()
  if (!normalized || generating.value) return
  question.value = ''
  await send(normalized)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  void submit()
}

function nearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 80
}

function handleScroll() {
  const element = messageList.value
  if (element) followOutput.value = nearBottom(element)
}

function renderMarkdown(content: string) {
  if (!content) return ''
  return DOMPurify.sanitize(markdown.render(content), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
  })
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))

watch(
  messages,
  async () => {
    const element = messageList.value
    if (!element || !followOutput.value) return
    await nextTick()
    element.scrollTop = element.scrollHeight
  },
  { deep: true },
)
</script>

<template>
  <el-button
    class="ai-chat-entry"
    type="primary"
    size="large"
    :icon="ChatDotRound"
    :aria-label="open ? '关闭 AI 解析答疑助手' : '打开 AI 解析答疑助手'"
    :aria-expanded="open"
    @click="open = !open"
  >
    AI 答疑
  </el-button>

  <Teleport to="body">
    <Transition name="ai-chat-float">
      <section
        v-if="open"
        class="ai-chat-float"
        role="dialog"
        aria-label="解析结果答疑"
      >
        <div class="ai-chat">
          <header class="ai-chat__header">
            <div>
              <div class="ai-chat__title">
                <el-icon><ChatDotRound /></el-icon>
                解析结果答疑
              </div>
              <p>回答仅基于当前解析结果和原文，不会修改业务数据。</p>
            </div>
            <div class="ai-chat__header-actions">
              <el-tag v-if="model" effect="plain" size="small">{{
                model
              }}</el-tag>
              <el-button
                text
                circle
                :icon="Close"
                aria-label="关闭 AI 答疑助手"
                @click="open = false"
              />
            </div>
          </header>

          <main
            ref="messageList"
            class="ai-chat__messages"
            aria-live="polite"
            @scroll="handleScroll"
          >
            <div v-if="!messages.length" class="ai-chat__welcome">
              <div class="ai-chat__welcome-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <strong>针对这份解析结果继续提问</strong>
              <span>我会区分文档明确要求和执行建议。</span>
              <div class="ai-chat__quick-list">
                <button
                  v-for="item in quickQuestions"
                  :key="item"
                  type="button"
                  @click="submit(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>

            <article
              v-for="message in messages"
              :key="message.id"
              class="ai-chat__message"
              :class="`is-${message.role}`"
            >
              <div class="ai-chat__bubble">
                <div
                  v-if="message.content && message.role === 'assistant'"
                  class="ai-chat__markdown"
                  v-html="renderMarkdown(message.content)"
                />
                <span v-else-if="message.content">{{ message.content }}</span>
                <span
                  v-else-if="message.state === 'streaming'"
                  class="ai-chat__thinking"
                >
                  正在思考<span>...</span>
                </span>
                <span v-else>
                  {{ message.state === 'stopped' ? '生成已停止' : '生成失败' }}
                </span>
              </div>
              <div
                v-if="
                  message.role === 'assistant' && message.state !== 'complete'
                "
                class="ai-chat__message-state"
              >
                <span v-if="message.state === 'stopped'">已停止生成</span>
                <span v-else-if="message.state === 'failed'">{{
                  message.error
                }}</span>
                <el-button
                  v-if="message.state === 'failed'"
                  text
                  type="primary"
                  size="small"
                  :icon="RefreshRight"
                  @click="retry(message.id)"
                >
                  重新生成
                </el-button>
              </div>
            </article>
          </main>

          <footer class="ai-chat__composer">
            <el-input
              v-model="question"
              class="ai-chat__input"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
              resize="none"
              placeholder="针对当前解析结果提问，Shift + Enter 换行"
              :disabled="generating"
              @keydown="handleKeydown"
            />
            <el-button
              v-if="generating"
              type="danger"
              plain
              :icon="VideoPause"
              @click="stop"
            >
              停止生成
            </el-button>
            <el-button
              v-else
              type="primary"
              :icon="Promotion"
              :disabled="!question.trim()"
              @click="submit()"
            >
              发送
            </el-button>
          </footer>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.ai-chat-entry {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 18;
  border-radius: 999px;
  box-shadow: var(--shadow-card);
  transform-origin: bottom right;

  &:focus-visible {
    outline: 3px solid var(--color-primary-soft);
    outline-offset: 3px;
  }
}

.ai-chat-float {
  position: fixed;
  right: 28px;
  bottom: 86px;
  z-index: 17;
  width: min(420px, calc(100vw - 32px));
  height: min(680px, calc(100vh - 118px));
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 18px 50px rgb(15 23 42 / 18%);
  transform-origin: bottom right;
}

.ai-chat-float-enter-active,
.ai-chat-float-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.ai-chat-float-enter-from,
.ai-chat-float-leave-to {
  opacity: 0;
  transform: translate(20px, 20px) scale(0.72);
}

.ai-chat {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--color-border);

    p {
      margin: 6px 0 0;
      color: var(--color-text-soft);
      font-size: 12px;
      line-height: 1.5;
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text);
    font-size: 17px;
    font-weight: 700;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__messages {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 18px;
    overflow-y: auto;
    padding: 20px 4px;
  }

  &__welcome {
    display: flex;
    align-items: center;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    text-align: center;

    > span {
      margin-top: 6px;
      color: var(--color-text-soft);
      font-size: 13px;
    }
  }

  &__welcome-icon {
    display: grid;
    width: 52px;
    height: 52px;
    margin-bottom: 14px;
    place-items: center;
    border-radius: 16px;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 26px;
  }

  &__quick-list {
    display: grid;
    width: 100%;
    gap: 9px;
    margin-top: 22px;

    button {
      padding: 11px 14px;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-surface);
      color: var(--color-text);
      cursor: pointer;
      text-align: left;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease;

      &:hover,
      &:focus-visible {
        border-color: var(--color-primary);
        background: var(--color-primary-soft);
        outline: none;
      }
    }
  }

  &__message {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;

    &.is-user {
      align-items: flex-end;

      .ai-chat__bubble {
        background: var(--color-primary);
        color: white;
      }
    }
  }

  &__bubble {
    max-width: 88%;
    padding: 11px 13px;
    border-radius: 14px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 14px;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  &__markdown {
    white-space: normal;

    :deep(p) {
      margin: 0 0 0.7em;
    }

    :deep(p:last-child) {
      margin-bottom: 0;
    }

    :deep(ul),
    :deep(ol) {
      margin: 0.45em 0;
      padding-left: 1.4em;
    }

    :deep(pre) {
      overflow-x: auto;
      margin: 0.7em 0;
      padding: 10px;
      border-radius: 8px;
      background: rgb(15 23 42 / 8%);
    }

    :deep(code) {
      padding: 0.12em 0.3em;
      border-radius: 4px;
      background: rgb(15 23 42 / 8%);
      font-size: 0.9em;
    }

    :deep(pre code) {
      padding: 0;
      background: transparent;
    }

    :deep(a) {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__thinking {
    color: var(--color-text-soft);
  }

  &__message-state {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-soft);
    font-size: 12px;
  }

  &__composer {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  &__input {
    flex: 1;

    :deep(.el-textarea__inner) {
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 14px;
      line-height: 1.6;
      box-shadow: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &::placeholder {
        color: var(--color-text-soft);
      }

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-soft);
      }
    }
  }
}

@media (max-width: 560px) {
  .ai-chat-entry {
    right: 16px;
    bottom: 84px;
  }

  .ai-chat-float {
    right: 16px;
    bottom: 142px;
    width: calc(100vw - 32px);
    height: min(680px, calc(100vh - 174px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-chat-float-enter-active,
  .ai-chat-float-leave-active,
  .ai-chat__quick-list button {
    transition: none;
  }
}
</style>
