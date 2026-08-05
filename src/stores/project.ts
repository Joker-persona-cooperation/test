import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDocument, type Document as SourceDocument } from '@/api/document'
import { isApiError } from '@/api/errors'
import {
  getHistoryParseResults,
  getHistoryProject,
  getHistoryProjectTasks,
  getHistoryProjects,
} from '@/api/history'
import { getParseResult } from '@/api/parseResult'
import type { ParseResult } from '@/api/parseJob'
import {
  archiveProject,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  unarchiveProject,
  updateProject,
  type Project,
  type UpdateProjectParams,
} from '@/api/project'
import {
  createTask,
  deleteTask,
  getProjectTasks,
  reorderTasks,
  updateTask,
  updateTaskStatus,
  type CreateTaskParams,
  type ReorderTasksParams,
  type Task,
  type UpdateTaskParams,
} from '@/api/task'
import type { ProjectStatus } from '@/constants/project'
import type { TaskStatus } from '@/constants/task'

export type { ParseResult } from '@/api/parseJob'
export type { Project, UpdateProjectParams } from '@/api/project'
export type {
  CreateTaskParams,
  ReorderTasksParams,
  Task,
  UpdateTaskParams,
} from '@/api/task'

const MAX_PAGE_SIZE = 100

export function isVersionConflict(error: unknown) {
  return isApiError(error) && error.code === 10007
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const total = ref(0)
  const listLoading = ref(false)
  const listError = ref('')
  const currentProject = ref<Project | null>(null)
  const tasks = ref<Task[]>([])
  const sourceDocument = ref<SourceDocument | null>(null)
  const sourceResult = ref<ParseResult | null>(null)

  async function loadProjects(
    status: ProjectStatus,
    page: number,
    pageSize: number,
  ) {
    listLoading.value = true
    listError.value = ''
    try {
      const data =
        status === 'deleted'
          ? await getHistoryProjects(page, pageSize, status)
          : await getProjects(status, page, pageSize)
      projects.value = data.items
      total.value = data.total
    } catch (error) {
      listError.value = error instanceof Error ? error.message : '项目加载失败'
    } finally {
      listLoading.value = false
    }
  }

  async function loadAllHistoryProjects() {
    const firstPage = await getHistoryProjects(1, MAX_PAGE_SIZE)
    const allProjects = [...firstPage.items]
    const pageCount = Math.ceil(firstPage.total / MAX_PAGE_SIZE)
    for (let page = 2; page <= pageCount; page += 1) {
      const data = await getHistoryProjects(page, MAX_PAGE_SIZE)
      allProjects.push(...data.items)
    }
    return allProjects
  }

  async function loadAllParseResults() {
    const firstPage = await getHistoryParseResults(1, MAX_PAGE_SIZE)
    const allResults = [...firstPage.items]
    const pageCount = Math.ceil(firstPage.total / MAX_PAGE_SIZE)
    for (let page = 2; page <= pageCount; page += 1) {
      const data = await getHistoryParseResults(page, MAX_PAGE_SIZE)
      allResults.push(...data.items)
    }
    return allResults
  }

  async function findProjectByParseResultId(parseResultId: number) {
    const projectItems = await loadAllHistoryProjects()
    return (
      projectItems.find((item) => item.parse_result_id === parseResultId) ??
      null
    )
  }

  async function loadAvailableParseResults() {
    const [results, projectItems] = await Promise.all([
      loadAllParseResults(),
      loadAllHistoryProjects(),
    ])
    const usedResultIds = new Set(
      projectItems.map((item) => item.parse_result_id),
    )
    return results.filter(
      (item) => item.is_confirmed && !usedResultIds.has(item.id),
    )
  }

  async function createFromResult(result: ParseResult) {
    return createProject({ parse_result_id: result.id, name: result.title })
  }

  async function loadProject(projectId: number, historyMode = false) {
    const [projectData, taskData] = historyMode
      ? await Promise.all([
          getHistoryProject(projectId),
          getHistoryProjectTasks(projectId),
        ])
      : await Promise.all([getProject(projectId), getProjectTasks(projectId)])
    currentProject.value = projectData
    tasks.value = taskData.items

    const [documentResult, parseResult] = await Promise.allSettled([
      getDocument(projectData.source_document_id),
      getParseResult(projectData.parse_result_id),
    ])
    sourceDocument.value =
      documentResult.status === 'fulfilled' ? documentResult.value : null
    sourceResult.value =
      parseResult.status === 'fulfilled' ? parseResult.value : null
    return projectData
  }

  async function reloadTasks(projectId: number, historyMode = false) {
    const data = historyMode
      ? await getHistoryProjectTasks(projectId)
      : await getProjectTasks(projectId)
    tasks.value = data.items
  }

  async function saveCurrentProject(
    projectId: number,
    params: UpdateProjectParams,
  ) {
    const project = await updateProject(projectId, params)
    currentProject.value = project
    return project
  }

  async function archiveCurrentProject(projectId: number) {
    currentProject.value = await archiveProject(projectId)
    return currentProject.value
  }

  async function unarchiveCurrentProject(projectId: number) {
    currentProject.value = await unarchiveProject(projectId)
    return currentProject.value
  }

  async function removeCurrentProject(projectId: number) {
    await deleteProject(projectId)
    currentProject.value = null
    tasks.value = []
  }

  function replaceTask(task: Task) {
    const index = tasks.value.findIndex((item) => item.id === task.id)
    if (index >= 0) tasks.value[index] = task
  }

  async function changeTaskStatus(taskId: number, status: TaskStatus) {
    const task = await updateTaskStatus(taskId, status)
    replaceTask(task)
    return task
  }

  async function addTask(projectId: number, params: CreateTaskParams) {
    const task = await createTask(projectId, params)
    tasks.value.push(task)
    return task
  }

  async function saveTask(taskId: number, params: UpdateTaskParams) {
    const task = await updateTask(taskId, params)
    replaceTask(task)
    return task
  }

  async function removeTask(taskId: number) {
    await deleteTask(taskId)
    tasks.value = tasks.value.filter((item) => item.id !== taskId)
  }

  async function reorderProjectTasks(params: ReorderTasksParams) {
    const reordered = await reorderTasks(params)
    tasks.value = reordered.items
    return reordered.items
  }

  return {
    projects,
    total,
    listLoading,
    listError,
    currentProject,
    tasks,
    sourceDocument,
    sourceResult,
    loadProjects,
    loadAllHistoryProjects,
    loadAllParseResults,
    findProjectByParseResultId,
    loadAvailableParseResults,
    createFromResult,
    loadProject,
    reloadTasks,
    saveCurrentProject,
    archiveCurrentProject,
    unarchiveCurrentProject,
    removeCurrentProject,
    changeTaskStatus,
    addTask,
    saveTask,
    removeTask,
    reorderProjectTasks,
  }
})
