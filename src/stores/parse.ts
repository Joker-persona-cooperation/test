import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createPdfDocument,
  createTextDocument,
  getDocument,
  type Document,
} from '@/api/document'
import {
  createParseJob,
  getLatestParseJob,
  getParseJob,
  getParseJobResult,
  retryParseJob,
  type ParseJob,
  type ParseResult,
} from '@/api/parseJob'
import {
  confirmParseResult,
  updateParseResult,
  type UpdateParseResultParams,
} from '@/api/parseResult'

export type { ParseJob, ParseJobStatus, ParseResult } from '@/api/parseJob'
export type { UpdateParseResultParams } from '@/api/parseResult'

export const useParseStore = defineStore('parse', () => {
  const currentJob = ref<ParseJob | null>(null)
  const currentResult = ref<ParseResult | null>(null)
  const sourceDocument = ref<Document | null>(null)

  async function createFromText(title: string, text: string) {
    const document = await createTextDocument({ title, text })
    const job = await createParseJob({ document_id: document.id })
    currentJob.value = job
    return job
  }

  async function uploadPdfDocument(
    file: File,
    title?: string,
    signal?: AbortSignal,
    onProgress?: (percent: number) => void,
  ) {
    const document = await createPdfDocument({
      file,
      title,
      signal,
      onProgress,
    })
    sourceDocument.value = document
    return document
  }

  async function createJobForDocument(
    documentId: number,
    signal?: AbortSignal,
  ) {
    const job = await createParseJob({ document_id: documentId }, signal)
    currentJob.value = job
    return job
  }

  async function loadLatestJobForDocument(
    documentId: number,
    signal?: AbortSignal,
  ) {
    const job = await getLatestParseJob(documentId, signal)
    currentJob.value = job
    return job
  }

  async function fetchJob(jobId: number) {
    const job = await getParseJob(jobId)
    currentJob.value = job
    return job
  }

  async function retryJob(jobId: number) {
    const job = await retryParseJob(jobId)
    currentJob.value = job
    return job
  }

  async function loadResult(jobId: number) {
    const result = await getParseJobResult(jobId)
    currentResult.value = result
    try {
      sourceDocument.value = await getDocument(result.document_id)
    } catch {
      sourceDocument.value = null
    }
    return result
  }

  async function saveResult(params: UpdateParseResultParams) {
    if (!currentResult.value) return null
    const result = await updateParseResult(currentResult.value.id, params)
    currentResult.value = result
    return result
  }

  async function confirmResult() {
    if (!currentResult.value) return null
    const result = await confirmParseResult(currentResult.value.id)
    currentResult.value = result
    return result
  }

  return {
    currentJob,
    currentResult,
    sourceDocument,
    createFromText,
    uploadPdfDocument,
    createJobForDocument,
    loadLatestJobForDocument,
    fetchJob,
    retryJob,
    loadResult,
    saveResult,
    confirmResult,
  }
})
