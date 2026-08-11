import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHistoryParseResults, getHistoryProjects } from '@/api/history'
import type { ParseResult } from '@/api/parseJob'
import type { Project } from '@/api/project'

export type { ParseResult } from '@/api/parseJob'
export type { Project } from '@/api/project'

export const useHistoryStore = defineStore('history', () => {
  const parseResults = ref<ParseResult[]>([])
  const parseTotal = ref(0)
  const parseLoading = ref(false)
  const parseError = ref('')
  const projects = ref<Project[]>([])
  const projectTotal = ref(0)
  const projectLoading = ref(false)
  const projectError = ref('')

  async function loadParseResults(page: number, pageSize: number) {
    parseLoading.value = true
    parseError.value = ''
    try {
      const data = await getHistoryParseResults(page, pageSize)
      parseResults.value = data.items
      parseTotal.value = data.total
    } catch (loadErr) {
      parseError.value =
        loadErr instanceof Error ? loadErr.message : '解析记录加载失败'
      parseResults.value = []
      parseTotal.value = 0
    } finally {
      parseLoading.value = false
    }
  }

  async function loadProjects(page: number, pageSize: number) {
    projectLoading.value = true
    projectError.value = ''
    try {
      const data = await getHistoryProjects(page, pageSize)
      projects.value = data.items
      projectTotal.value = data.total
    } catch (loadErr) {
      projectError.value =
        loadErr instanceof Error ? loadErr.message : '项目记录加载失败'
      projects.value = []
      projectTotal.value = 0
    } finally {
      projectLoading.value = false
    }
  }

  return {
    parseResults,
    parseTotal,
    parseLoading,
    parseError,
    projects,
    projectTotal,
    projectLoading,
    projectError,
    loadParseResults,
    loadProjects,
  }
})
