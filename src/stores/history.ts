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
  const projects = ref<Project[]>([])
  const projectTotal = ref(0)
  const projectLoading = ref(false)

  async function loadParseResults(page: number, pageSize: number) {
    parseLoading.value = true
    try {
      const data = await getHistoryParseResults(page, pageSize)
      parseResults.value = data.items
      parseTotal.value = data.total
    } finally {
      parseLoading.value = false
    }
  }

  async function loadProjects(page: number, pageSize: number) {
    projectLoading.value = true
    try {
      const data = await getHistoryProjects(page, pageSize)
      projects.value = data.items
      projectTotal.value = data.total
    } finally {
      projectLoading.value = false
    }
  }

  return {
    parseResults,
    parseTotal,
    parseLoading,
    projects,
    projectTotal,
    projectLoading,
    loadParseResults,
    loadProjects,
  }
})
