<script setup lang="ts">
// 第三步：处理中状态页
// 进入后轮询 GET /parse-jobs/:jobId：
//   - pending / processing -> 继续轮询
//   - success -> 跳结果页 /parse/:jobId/result
//   - failed -> 展示失败原因，可返回重新录入
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { useParseStore, type ParseJobStatus } from '@/stores/parse'

const route = useRoute()
const router = useRouter()
const parseStore = useParseStore()
const { currentJob: job } = storeToRefs(parseStore)

const jobId = Number(route.params.jobId)
const loading = ref(true)
const errorMsg = ref('')
const retrying = ref(false)

// 轮询间隔与上限：3s 一次，最多约 5 分钟
const POLL_INTERVAL = 3000
const MAX_POLLS = 100
let pollCount = 0
let timer: ReturnType<typeof setTimeout> | null = null

const statusView = ref<ParseJobStatus | 'loading'>('loading')

const statusText = computed(() => {
  switch (statusView.value) {
    case 'pending':
      return '排队中'
    case 'processing':
      return '解析中'
    case 'success':
      return '解析完成'
    case 'failed':
      return '解析失败'
    default:
      return '加载中'
  }
})

const failureType = computed(() => {
  const message = errorMsg.value.toLowerCase()
  if (/network|timeout|连接|超时|temporar/.test(message)) {
    return {
      title: '网络或服务暂时不可用',
      suggestion: '原始任务已保留，可直接重试，无需重新录入内容。',
    }
  }
  if (/content|document|文本|内容|empty|格式/.test(message)) {
    return {
      title: '文档内容无法完成解析',
      suggestion: '建议检查原文是否完整、清晰，再修改内容后重新解析。',
    }
  }
  return {
    title: '解析服务未能完成任务',
    suggestion: '可以先原地重试；若仍失败，再修改原文重新解析。',
  }
})

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function scheduleNext() {
  clearTimer()
  timer = setTimeout(poll, POLL_INTERVAL)
}

async function poll() {
  if (pollCount >= MAX_POLLS) {
    errorMsg.value = '解析超时，请稍后在历史记录中查看结果'
    statusView.value = 'failed'
    loading.value = false
    return
  }
  pollCount++
  try {
    const data = await parseStore.fetchJob(jobId)
    statusView.value = data.status
    loading.value = false

    if (data.status === 'success') {
      // 成功：跳结果详情页
      router.replace(`/parse/${jobId}/result`)
      return
    }
    if (data.status === 'failed') {
      errorMsg.value = data.error_message || '解析失败，请检查内容后重试'
      return
    }
    // 仍在处理：继续轮询
    scheduleNext()
  } catch (e) {
    // 单次轮询失败不立即终止，给一定容错后重试
    loading.value = false
    if (pollCount >= MAX_POLLS) {
      errorMsg.value =
        e instanceof Error ? e.message : '网络异常，解析状态获取失败'
      statusView.value = 'failed'
    } else {
      scheduleNext()
    }
  }
}

function goNew() {
  router.push('/parse/new')
}

function goDashboard() {
  router.push('/dashboard')
}

async function handleRetry() {
  retrying.value = true
  clearTimer()
  try {
    const retried = await parseStore.retryJob(jobId)
    pollCount = 0
    errorMsg.value = ''
    statusView.value = retried.status
    loading.value = false
    ElMessage.success('已提交重试')
    if (retried.status === 'success') {
      await router.replace(`/parse/${jobId}/result`)
      return
    }
    scheduleNext()
  } finally {
    retrying.value = false
  }
}

onMounted(() => {
  if (!Number.isFinite(jobId) || jobId <= 0) {
    ElMessage.error('任务 ID 无效')
    router.replace('/parse/new')
    return
  }
  poll()
})

onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="parse-processing">
    <div class="processing-card">
      <!-- 加载/处理中 -->
      <div
        v-if="
          loading || statusView === 'pending' || statusView === 'processing'
        "
        class="state state--loading"
      >
        <div class="state-icon state-icon--spin">
          <el-icon><Loading /></el-icon>
        </div>
        <h2>{{ statusText }}</h2>
        <p class="state-desc">
          AI 正在分析你的文档内容，拆解目标、交付物、要求与任务清单，通常需要
          10-30 秒，请稍候。
        </p>
        <div class="progress-track">
          <div class="progress-bar" />
        </div>
        <p class="job-id">任务编号：{{ jobId }}</p>
      </div>

      <!-- 成功（短暂展示后自动跳转） -->
      <div v-else-if="statusView === 'success'" class="state state--success">
        <div class="state-icon state-icon--success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <h2>解析完成</h2>
        <p class="state-desc">正在跳转结果详情页...</p>
      </div>

      <!-- 失败 -->
      <div v-else class="state state--failed">
        <div class="state-icon state-icon--failed">
          <el-icon><CircleClose /></el-icon>
        </div>
        <h2>{{ failureType.title }}</h2>
        <p class="state-desc">{{ errorMsg }}</p>
        <p class="failure-suggestion">{{ failureType.suggestion }}</p>
        <p class="retry-count">已重试 {{ job?.retry_count ?? 0 }} 次</p>
        <div class="state-actions">
          <el-button type="primary" :loading="retrying" @click="handleRetry">
            重试当前任务
          </el-button>
          <el-button :disabled="retrying" @click="goNew">修改原文</el-button>
          <el-button @click="goDashboard">返回工作台</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.parse-processing {
  display: flex;
  justify-content: center;

  .processing-card {
    width: 100%;
    max-width: 560px;
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 56px 40px;
    text-align: center;
  }

  .state-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;

    &--spin {
      color: var(--color-primary);
      animation: tp-spin 1.1s linear infinite;
    }

    &--success {
      background: var(--color-success-soft);
      color: var(--color-success);
    }

    &--failed {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }
  }

  @keyframes tp-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .state {
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text);
    }

    .state-desc {
      margin: 0 auto;
      max-width: 380px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--color-text-soft);
    }

    .job-id {
      margin: 20px 0 0;
      font-size: 12px;
      color: var(--color-text-soft);
      opacity: 0.8;
    }

    .state-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .failure-suggestion {
      margin: 10px auto 0;
      max-width: 400px;
      color: var(--color-text);
      font-size: 13px;
      line-height: 1.6;
    }

    .retry-count {
      margin: 12px 0 0;
      color: var(--color-text-soft);
      font-size: 12px;
    }
  }

  @media (max-width: 600px) {
    .processing-card {
      padding: 36px 20px;
    }

    .state .state-actions {
      align-items: stretch;
      flex-direction: column;
    }
  }

  .progress-track {
    margin: 24px auto 0;
    width: 240px;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg);
    overflow: hidden;
    position: relative;

    .progress-bar {
      position: absolute;
      inset: 0;
      width: 40%;
      border-radius: 3px;
      background: linear-gradient(
        90deg,
        var(--color-primary),
        var(--color-primary-deep)
      );
      animation: tp-progress 1.4s ease-in-out infinite;
    }
  }

  @keyframes tp-progress {
    0% {
      left: -40%;
    }
    100% {
      left: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .state-icon--spin,
    .progress-bar {
      animation: none;
    }
  }
}
</style>
