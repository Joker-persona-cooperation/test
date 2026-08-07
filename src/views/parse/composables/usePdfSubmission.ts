import { computed, onScopeDispose, reactive } from 'vue'
import { isApiError, isRequestCanceled } from '@/api/errors'
import { useParseStore, type ParseJob } from '@/stores/parse'

export const MAX_PDF_SIZE = 10 * 1024 * 1024
export const MAX_PDF_PAGES = 50

export type PdfSubmissionPhase =
  | 'empty'
  | 'validating'
  | 'ready'
  | 'uploading'
  | 'serverProcessing'
  | 'creatingJob'
  | 'failed'
  | 'cancelled'
  | 'succeeded'

export type PdfFailurePhase =
  'validation' | 'upload' | 'processing' | 'creatingJob'

interface PdfSubmissionState {
  phase: PdfSubmissionPhase
  file: File | null
  progress: number
  documentId: number | null
  jobId: number | null
  failedAt: PdfFailurePhase | null
  errorMessage: string
}

const BUSY_PHASES: PdfSubmissionPhase[] = [
  'uploading',
  'serverProcessing',
  'creatingJob',
]

export function usePdfSubmission() {
  const parseStore = useParseStore()
  const state = reactive<PdfSubmissionState>(initialState())
  let controller: AbortController | null = null
  let selectionRevision = 0

  const isBusy = computed(() => BUSY_PHASES.includes(state.phase))
  const canRetry = computed(
    () =>
      (state.phase === 'failed' || state.phase === 'cancelled') && !!state.file,
  )
  const statusText = computed(() => {
    switch (state.phase) {
      case 'validating':
        return '正在校验 PDF 文件...'
      case 'uploading':
        return `正在上传文件... ${state.progress}%`
      case 'serverProcessing':
        return '上传完成，服务器正在校验并提取文字...'
      case 'creatingJob':
        return '文档已就绪，正在创建 AI 解析任务...'
      case 'cancelled':
        return '本次提交已取消，可以重新提交或更换文件。'
      case 'failed':
        return state.errorMessage
      default:
        return ''
    }
  })

  async function selectFile(file: File) {
    if (isBusy.value) return false
    const revision = ++selectionRevision
    Object.assign(state, initialState(), { phase: 'validating' as const })

    let validationError = ''
    try {
      validationError = await validatePdf(file)
    } catch {
      validationError = '无法读取该文件，请重新选择。'
    }
    if (revision !== selectionRevision) return false
    if (validationError) {
      Object.assign(state, {
        phase: 'failed' as const,
        failedAt: 'validation' as const,
        errorMessage: validationError,
      })
      return false
    }

    Object.assign(state, {
      phase: 'ready' as const,
      file,
      progress: 0,
      documentId: null,
      jobId: null,
      failedAt: null,
      errorMessage: '',
    })
    return true
  }

  function clearFile() {
    selectionRevision += 1
    cancel()
    Object.assign(state, initialState())
  }

  async function submit(title?: string): Promise<ParseJob | null> {
    if (!state.file || isBusy.value) return null

    const activeController = new AbortController()
    controller = activeController
    state.errorMessage = ''
    state.failedAt = null

    try {
      if (!state.documentId) {
        state.phase = 'uploading'
        state.progress = 0
        const document = await parseStore.uploadPdfDocument(
          state.file,
          title,
          activeController.signal,
          (percent) => {
            if (controller !== activeController) return
            state.progress = percent
            state.phase = percent >= 100 ? 'serverProcessing' : 'uploading'
          },
        )
        state.documentId = document.id
      }

      state.phase = 'creatingJob'
      const job = await createOrRecoverJob(
        state.documentId,
        activeController.signal,
      )
      state.jobId = job.id
      state.phase = 'succeeded'
      return job
    } catch (error) {
      if (controller !== activeController) return null
      if (isRequestCanceled(error)) {
        state.phase = 'cancelled'
        state.errorMessage = ''
        state.failedAt = null
        return null
      }

      state.failedAt = failurePhase(state.phase)
      state.errorMessage = errorMessage(error, state.failedAt)
      state.phase = 'failed'
      return null
    } finally {
      if (controller === activeController) controller = null
    }
  }

  function retry(title?: string) {
    return submit(title)
  }

  function cancel() {
    if (!controller) return
    const activeController = controller
    controller = null
    activeController.abort()
    state.phase = 'cancelled'
    state.errorMessage = ''
    state.failedAt = null
  }

  async function createOrRecoverJob(documentId: number, signal: AbortSignal) {
    try {
      return await parseStore.createJobForDocument(documentId, signal)
    } catch (error) {
      if (!isApiError(error) || error.code !== 10007) throw error
      return parseStore.loadLatestJobForDocument(documentId, signal)
    }
  }

  onScopeDispose(cancel)

  return {
    state,
    isBusy,
    canRetry,
    statusText,
    selectFile,
    clearFile,
    submit,
    retry,
    cancel,
  }
}

function initialState(): PdfSubmissionState {
  return {
    phase: 'empty',
    file: null,
    progress: 0,
    documentId: null,
    jobId: null,
    failedAt: null,
    errorMessage: '',
  }
}

async function validatePdf(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf')) return '仅支持导入 PDF 文件'
  if (file.size === 0) return 'PDF 文件不能为空'
  if (file.size > MAX_PDF_SIZE) return 'PDF 文件不能超过 10MB'

  const signatureBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const signature = String.fromCharCode(...signatureBytes)
  if (signature !== '%PDF-') return '文件内容不是有效的 PDF 格式'
  return ''
}

function failurePhase(phase: PdfSubmissionPhase): PdfFailurePhase {
  if (phase === 'creatingJob') return 'creatingJob'
  if (phase === 'serverProcessing') return 'processing'
  return 'upload'
}

function errorMessage(error: unknown, phase: PdfFailurePhase) {
  if (isApiError(error)) {
    switch (error.code) {
      case 10009:
        return 'PDF 文件超过服务端大小限制，请选择 10MB 以内的文件。'
      case 10012:
        return '文件内容不是有效的 PDF，请重新选择。'
      case 10013:
        return 'PDF 可能已加密、损坏、超过 50 页或没有可提取的文字层。'
      case 10010:
        return 'PDF 提取服务暂时繁忙，请稍后重试。'
    }
    if (error.status === undefined) {
      return phase === 'creatingJob'
        ? '文档已保存，但解析任务创建失败，可以直接重试，无需重新上传。'
        : 'PDF 提交失败，请检查网络后重试。'
    }
    return error.message
  }
  return phase === 'creatingJob'
    ? '文档已保存，但解析任务创建失败，可以直接重试，无需重新上传。'
    : 'PDF 提交失败，请检查网络后重试。'
}
