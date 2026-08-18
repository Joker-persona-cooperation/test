<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Box,
  Calendar,
  Delete,
  Document,
  Edit,
  MoreFilled,
  Plus,
  Refresh,
  Upload,
} from '@element-plus/icons-vue'
import { isVersionConflict, useProjectStore, type Task } from '@/stores/project'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TAG } from '@/constants/project'
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_OPTIONS,
  TASK_PRIORITY_TAG,
  TASK_STATUS_COLUMNS as columns,
  type TaskPriority,
  type TaskStatus,
} from '@/constants/task'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const projectId = Number(route.params.projectId)
const projectStore = useProjectStore()
const {
  currentProject: project,
  tasks,
  sourceDocument,
  sourceResult,
} = storeToRefs(projectStore)
const loading = ref(true)
const errorMsg = ref('')
// 状态切换中的任务 id，用于禁用对应卡片的下拉
const updatingTaskIds = ref(new Set<number>())
// 排序请求进行中的任务 id，避免连点造成顺序错乱
const reordering = ref(false)
const draggedTaskId = ref<number | null>(null)
const dragOriginStatus = ref<TaskStatus | null>(null)
// 拖拽占位：{ status: 目标列, index: 插入位置 }，index 相对"排除被拖卡片"的其他卡片列表计算
const dragPlaceholder = ref<{ status: TaskStatus; index: number } | null>(null)
const suppressCardClick = ref(false)
const highlightedTaskId = ref<number | null>(null)
const historyMode = computed(
  () => route.query.mode === 'history' || project.value?.status === 'deleted',
)

const doneCount = computed(
  () => tasks.value.filter((task) => task.status === 'done').length,
)
const progress = computed(() =>
  tasks.value.length
    ? Math.round((doneCount.value / tasks.value.length) * 100)
    : 0,
)
const readonly = computed(() => project.value?.status !== 'active')

const projectDialogVisible = ref(false)
const savingProject = ref(false)
const projectForm = reactive({ name: '', description: '', deadline: '' })

// 弹窗状态：create / edit 共用一个 form，避免两份表单逻辑漂移
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const savingTask = ref(false)
const removingTask = ref(false)
const form = reactive({
  id: null as number | null,
  version: 0,
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  deadline: '',
  status: 'todo' as TaskStatus,
})

function columnTasks(status: TaskStatus) {
  // 列内按 sort_order 升序，保证看板顺序与服务端一致
  return tasks.value
    .filter((task) => task.status === status)
    .sort((a, b) => a.sort_order - b.sort_order)
}

type ColumnEntry = { key: string; task: Task | null }

// 渲染列内容：在目标列对应位置插入占位条，被拖卡片始终留在原列，不做实时搬家
function columnEntries(status: TaskStatus): ColumnEntry[] {
  const cards: ColumnEntry[] = columnTasks(status).map((task) => ({
    key: `task-${task.id}`,
    task,
  }))
  const placeholder = dragPlaceholder.value
  if (
    placeholder &&
    placeholder.status === status &&
    draggedTaskId.value != null
  ) {
    cards.splice(placeholder.index, 0, { key: 'drop-placeholder', task: null })
  }
  return cards
}

async function loadProjectTasks() {
  // 排序回滚 / 乐观锁冲突后只刷新任务，不重载整页项目信息
  try {
    await projectStore.reloadTasks(projectId, historyMode.value)
  } catch {
    // 静默：整页加载由 loadProject 兜底提示
  }
}

async function loadProject() {
  loading.value = true
  errorMsg.value = ''
  try {
    await projectStore.loadProject(projectId, historyMode.value)
    await focusRequestedTask()
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '项目加载失败'
  } finally {
    loading.value = false
  }
}

async function focusRequestedTask() {
  const taskId = Number(route.query.task)
  if (
    !Number.isInteger(taskId) ||
    !tasks.value.some((task) => task.id === taskId)
  ) {
    return
  }
  highlightedTaskId.value = taskId
  await nextTick()
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  document
    .querySelector<HTMLElement>(`[data-task-id="${taskId}"]`)
    ?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  window.setTimeout(() => {
    if (highlightedTaskId.value === taskId) highlightedTaskId.value = null
  }, 2600)
}

function goProjectList() {
  const returnStatus = project.value?.status || route.query.status || 'active'
  void router.push({
    name: 'projects',
    query: { status: String(returnStatus) },
  })
}

function openSourceResult() {
  if (!sourceResult.value) return
  void router.push({
    name: 'parse-result',
    params: { jobId: sourceResult.value.parse_job_id },
  })
}

async function changeStatus(task: Task, status: TaskStatus) {
  if (task.status === status || updatingTaskIds.value.has(task.id)) return
  const previousStatus = task.status
  task.status = status
  updatingTaskIds.value.add(task.id)
  try {
    await projectStore.changeTaskStatus(task.id, status)
    ElMessage.success('任务状态已更新')
  } catch {
    task.status = previousStatus
  } finally {
    updatingTaskIds.value.delete(task.id)
  }
}

function openCreateForColumn(status: TaskStatus) {
  if (readonly.value) return
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    version: 0,
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    status,
  })
  dialogVisible.value = true
}

function openEdit(task: Task) {
  if (readonly.value) return
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: task.id,
    version: task.version,
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    deadline: task.deadline ?? '',
    status: task.status,
  })
  dialogVisible.value = true
}

function handleCardClick(task: Task) {
  if (!suppressCardClick.value) openEdit(task)
}

function openProjectEdit() {
  if (!project.value || readonly.value) return
  Object.assign(projectForm, {
    name: project.value.name,
    description: project.value.description ?? '',
    deadline: project.value.deadline ?? '',
  })
  projectDialogVisible.value = true
}

async function saveProject() {
  if (!project.value || !projectForm.name.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  savingProject.value = true
  try {
    await projectStore.saveCurrentProject(projectId, {
      version: project.value.version,
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
      deadline: projectForm.deadline || null,
    })
    projectDialogVisible.value = false
    ElMessage.success('项目已更新')
  } catch (error) {
    if (isVersionConflict(error)) {
      ElMessage.warning('项目已被改动，正在加载最新数据')
      await loadProject()
    }
  } finally {
    savingProject.value = false
  }
}

async function handleProjectAction(
  command: 'edit' | 'archive' | 'unarchive' | 'delete',
) {
  if (!project.value) return
  if (command === 'edit') {
    openProjectEdit()
    return
  }
  if (command === 'archive') {
    try {
      await ElMessageBox.confirm(
        '归档后项目将变为只读，确认归档？',
        '归档项目',
        {
          confirmButtonText: '归档',
          cancelButtonText: '取消',
          customClass: 'rounded-message-box',
        },
      )
    } catch {
      return
    }
    await projectStore.archiveCurrentProject(projectId)
    ElMessage.success('项目已归档')
    return
  }
  if (command === 'unarchive') {
    await projectStore.unarchiveCurrentProject(projectId)
    ElMessage.success('项目已恢复')
    return
  }
  try {
    await ElMessageBox.confirm(
      '删除后项目仅能在历史记录中查看，确认删除？',
      '删除项目',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        customClass: 'rounded-message-box',
      },
    )
  } catch {
    return
  }
  await projectStore.removeCurrentProject(projectId)
  ElMessage.success('项目已删除')
  await router.push({ name: 'projects', query: { status: 'deleted' } })
}

async function saveTask() {
  const title = form.title.trim()
  if (!title) {
    ElMessage.warning('请输入任务标题')
    return
  }
  savingTask.value = true
  try {
    if (dialogMode.value === 'create') {
      let created = await projectStore.addTask(projectId, {
        title,
        description: form.description.trim() || null,
        priority: form.priority,
        deadline: form.deadline || null,
      })
      if (form.status !== created.status) {
        created = await projectStore.changeTaskStatus(created.id, form.status)
      }
      ElMessage.success('任务已添加')
      dialogVisible.value = false
    } else {
      const id = form.id
      if (!id) return
      let updated = await projectStore.saveTask(id, {
        version: form.version,
        title,
        description: form.description.trim() || null,
        priority: form.priority,
        deadline: form.deadline || null,
      })
      if (form.status !== updated.status) {
        updated = await projectStore.changeTaskStatus(id, form.status)
      }
      ElMessage.success('任务已更新')
      dialogVisible.value = false
    }
  } catch (error) {
    // 乐观锁冲突（code 10007）：刷新任务列表拿到最新 version 后让用户重试
    if (isVersionConflict(error)) {
      ElMessage.warning('任务已被改动，已刷新最新版本，请重试')
      await loadProjectTasks()
      dialogVisible.value = false
    }
    // 其它错误由 client.ts 统一 ElMessage.error，这里不重复提示
  } finally {
    savingTask.value = false
  }
}

async function removeTask() {
  if (!form.id) return
  try {
    await ElMessageBox.confirm('确定删除该任务？删除后无法恢复。', '删除任务', {
      type: 'warning',
      customClass: 'rounded-message-box',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  removingTask.value = true
  try {
    await projectStore.removeTask(form.id)
    ElMessage.success('任务已删除')
    dialogVisible.value = false
  } catch {
    // 失败时 client.ts 已弹出错误，保留弹窗供重试
  } finally {
    removingTask.value = false
  }
}

async function persistTaskOrder(
  columnStatus: TaskStatus,
  orderedColumn: Task[],
) {
  let order = 0
  const taskIds: number[] = []
  for (const col of columns) {
    const colList =
      col.status === columnStatus ? orderedColumn : columnTasks(col.status)
    for (const item of colList) {
      item.sort_order = order++
      taskIds.push(item.id)
    }
  }
  reordering.value = true
  try {
    await projectStore.reorderProjectTasks({
      project_id: projectId,
      task_ids: taskIds,
    })
  } catch {
    // 服务端拒绝或网络失败：拉回服务端权威顺序
    await loadProjectTasks()
  } finally {
    reordering.value = false
  }
}

function canMoveTask(task: Task, direction: -1 | 1) {
  const ordered = columnTasks(task.status)
  const index = ordered.findIndex((item) => item.id === task.id)
  return (
    index >= 0 && index + direction >= 0 && index + direction < ordered.length
  )
}

async function moveTask(task: Task, direction: -1 | 1) {
  if (readonly.value || reordering.value || !canMoveTask(task, direction))
    return
  const ordered = columnTasks(task.status)
  const index = ordered.findIndex((item) => item.id === task.id)
  const target = index + direction
  ;[ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!]
  await persistTaskOrder(task.status, ordered)
}

function handleCardKeydown(task: Task, event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  handleCardClick(task)
}

function handleDragStart(task: Task, event: DragEvent) {
  if (readonly.value || reordering.value) return
  draggedTaskId.value = task.id
  dragOriginStatus.value = task.status
  dragPlaceholder.value = null
  suppressCardClick.value = true
  event.dataTransfer?.setData('text/plain', String(task.id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function handleColumnDragOver(status: TaskStatus, event: DragEvent) {
  const dragged = tasks.value.find((item) => item.id === draggedTaskId.value)
  if (!dragged) return
  // 列内任何位置（卡片、空白、列尾、空列）都允许放置：始终 preventDefault
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  // 以指针 Y 与列内各卡片（排除被拖卡片）的中点为界，计算插入索引
  const body = event.currentTarget as HTMLElement
  const cards = Array.from(
    body.querySelectorAll<HTMLElement>('[data-task-id]'),
  ).filter((el) => Number(el.dataset.taskId) !== draggedTaskId.value)
  const pointerY = event.clientY
  let index = cards.length
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i]!.getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) {
      index = i
      break
    }
  }
  dragPlaceholder.value = { status, index }
}

async function handleColumnDrop(status: TaskStatus, event: DragEvent) {
  event.preventDefault()
  const dragged = tasks.value.find((item) => item.id === draggedTaskId.value)
  const fromStatus = dragOriginStatus.value ?? dragged?.status
  const placeholder = dragPlaceholder.value
  if (!dragged || !placeholder || placeholder.status !== status) {
    handleDragEnd()
    return
  }
  const ordered = columnTasks(status)
  // placeholder.index 是相对"排除被拖卡片"的其他卡片列表计算的，因此移除后可直接使用
  const originalIndex = ordered.findIndex((item) => item.id === dragged.id)
  if (originalIndex >= 0) ordered.splice(originalIndex, 1)
  ordered.splice(placeholder.index, 0, dragged)
  // 同列且插入位置未变：不提交，仅结束拖拽
  if (fromStatus === status && originalIndex === placeholder.index) {
    handleDragEnd()
    return
  }
  // 跨列：先持久化状态变更（reorder 仅处理排序），再重排
  if (fromStatus !== status) {
    try {
      await projectStore.changeTaskStatus(dragged.id, status)
    } catch {
      await loadProjectTasks()
      handleDragEnd()
      return
    }
  }
  await persistTaskOrder(status, ordered)
  handleDragEnd()
}

function handleDragEnd() {
  draggedTaskId.value = null
  dragOriginStatus.value = null
  dragPlaceholder.value = null
  window.setTimeout(() => {
    suppressCardClick.value = false
  }, 0)
}

onMounted(() => {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    ElMessage.error('项目 ID 无效')
    router.replace({ name: 'projects' })
    return
  }
  loadProject()
})
</script>

<template>
  <div class="project-detail">
    <div v-if="loading" class="surface"><el-skeleton :rows="9" animated /></div>

    <el-result
      v-else-if="errorMsg"
      icon="error"
      title="项目加载失败"
      :sub-title="errorMsg"
    >
      <template #extra>
        <el-button @click="goProjectList">返回项目列表</el-button>
        <el-button type="primary" @click="loadProject">重新加载</el-button>
      </template>
    </el-result>

    <template v-else-if="project">
      <section class="surface project-head">
        <el-button text :icon="ArrowLeft" @click="goProjectList"
          >项目列表</el-button
        >
        <div class="project-title">
          <div class="title-row">
            <h2>{{ project.name }}</h2>
            <el-tag :type="PROJECT_STATUS_TAG[project.status]" effect="plain">
              {{ PROJECT_STATUS_LABEL[project.status] }}
            </el-tag>
          </div>
          <p>{{ project.description || '管理由解析结果生成的任务清单。' }}</p>
          <div class="project-meta">
            <span
              ><strong>截止日期</strong
              >{{ formatDateTime(project.deadline) }}</span
            >
            <span
              ><strong>创建日期</strong
              >{{ formatDateTime(project.created_at) }}</span
            >
            <button
              type="button"
              class="source-link"
              :disabled="!sourceResult"
              @click="openSourceResult"
            >
              <strong>来源文档</strong>
              <el-icon><Document /></el-icon>
              {{
                sourceDocument?.title || `文档 #${project.source_document_id}`
              }}
            </button>
          </div>
        </div>
        <div class="project-progress">
          <strong>{{ progress }}%</strong>
          <el-progress :percentage="progress" :show-text="false" />
          <span>{{ doneCount }}/{{ tasks.length }} 已完成</span>
        </div>
        <div class="project-actions">
          <el-button
            v-if="!readonly"
            type="primary"
            :icon="Plus"
            @click="openCreateForColumn('todo')"
            >新增任务</el-button
          >
          <el-dropdown
            v-if="project.status !== 'deleted'"
            trigger="click"
            @command="handleProjectAction"
          >
            <el-button :icon="MoreFilled">操作</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <template v-if="project.status === 'active'">
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑项目
                  </el-dropdown-item>
                  <el-dropdown-item command="archive">
                    <el-icon><Box /></el-icon>
                    归档
                  </el-dropdown-item>
                </template>
                <template v-else>
                  <el-dropdown-item command="unarchive">
                    <el-icon><Upload /></el-icon>
                    取消归档
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    divided
                    class="danger-item"
                    style="color: var(--el-color-danger)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除项目
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            circle
            :icon="Refresh"
            aria-label="刷新"
            @click="loadProject"
          />
        </div>
      </section>

      <el-alert
        v-if="readonly"
        type="info"
        :closable="false"
        :title="
          project.status === 'deleted'
            ? '已删除项目仅保留审计记录，不能恢复或编辑。'
            : '已归档项目为只读状态，恢复项目后才能修改任务。'
        "
        class="archive-alert"
      />

      <section class="kanban">
        <div
          v-for="column in columns"
          :key="column.status"
          class="kanban-column"
        >
          <div class="column-head">
            <div>
              <span :class="['status-dot', `status-dot--${column.status}`]" />{{
                column.label
              }}
            </div>
            <div class="column-head-tail">
              <span>{{ columnTasks(column.status).length }}</span>
              <el-button
                v-if="!readonly"
                text
                size="small"
                :icon="Plus"
                aria-label="在该列新增任务"
                @click="openCreateForColumn(column.status)"
              />
            </div>
          </div>

          <div
            class="column-body"
            @dragover="handleColumnDragOver(column.status, $event)"
            @drop="handleColumnDrop(column.status, $event)"
          >
            <template
              v-for="entry in columnEntries(column.status)"
              :key="entry.key"
            >
              <article
                v-if="entry.task"
                class="task-card"
                :class="{
                  'is-dragging': draggedTaskId === entry.task.id,
                  'is-editable': !readonly,
                  'is-highlighted': highlightedTaskId === entry.task.id,
                }"
                :data-task-id="entry.task.id"
                :draggable="!readonly && !reordering"
                tabindex="0"
                @click="handleCardClick(entry.task)"
                @keydown="handleCardKeydown(entry.task, $event)"
                @dragstart="handleDragStart(entry.task, $event)"
                @dragend="handleDragEnd"
              >
                <div class="task-card-head">
                  <h3>{{ entry.task.title }}</h3>
                  <span v-if="!readonly" class="drag-hint">拖拽可跨列排序</span>
                </div>
                <p v-if="entry.task.description">
                  {{ entry.task.description }}
                </p>
                <div class="task-meta">
                  <el-tag
                    size="small"
                    :type="TASK_PRIORITY_TAG[entry.task.priority]"
                    effect="plain"
                  >
                    {{ TASK_PRIORITY_LABEL[entry.task.priority] }}优先级
                  </el-tag>
                  <el-tag
                    v-if="entry.task.source_type === 'ai'"
                    size="small"
                    effect="plain"
                    >AI</el-tag
                  >
                  <span v-if="entry.task.deadline" class="task-deadline">
                    <el-icon><Calendar /></el-icon
                    >{{ formatDateTime(entry.task.deadline) }}
                  </span>
                </div>
                <div v-if="!readonly" class="task-reorder" @click.stop>
                  <el-button
                    size="small"
                    :disabled="reordering || !canMoveTask(entry.task, -1)"
                    @click="moveTask(entry.task, -1)"
                    >上移</el-button
                  >
                  <el-button
                    size="small"
                    :disabled="reordering || !canMoveTask(entry.task, 1)"
                    @click="moveTask(entry.task, 1)"
                    >下移</el-button
                  >
                </div>
                <el-select
                  :model-value="entry.task.status"
                  size="small"
                  :disabled="readonly || updatingTaskIds.has(entry.task.id)"
                  :loading="updatingTaskIds.has(entry.task.id)"
                  @click.stop
                  @change="changeStatus(entry.task, $event as TaskStatus)"
                >
                  <el-option
                    v-for="option in columns"
                    :key="option.status"
                    :label="option.label"
                    :value="option.status"
                  />
                </el-select>
              </article>
              <div v-else class="task-drop-placeholder" />
            </template>
            <el-empty
              v-if="
                columnTasks(column.status).length === 0 &&
                !(dragPlaceholder && dragPlaceholder.status === column.status)
              "
              :image-size="44"
              description="暂无任务"
            />
          </div>
        </div>
      </section>
    </template>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增任务' : '编辑任务'"
      width="min(480px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      class="rounded-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="任务标题">
          <el-input
            v-model="form.title"
            maxlength="255"
            placeholder="请输入任务标题"
          />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="可选"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="form.priority">
                <el-option
                  v-for="option in TASK_PRIORITY_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止时间">
              <el-date-picker
                v-model="form.deadline"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                placeholder="选择截止时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option
              v-for="option in columns"
              :key="option.status"
              :label="option.label"
              :value="option.status"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="dialogMode === 'edit'"
            type="danger"
            plain
            :icon="Delete"
            :loading="removingTask"
            @click="removeTask"
            >删除</el-button
          >
          <span class="dialog-footer-spacer" />
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingTask" @click="saveTask"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="projectDialogVisible"
      title="编辑项目"
      width="min(520px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      class="rounded-dialog"
    >
      <el-form :model="projectForm" label-position="top">
        <el-form-item label="项目名称">
          <el-input v-model="projectForm.name" maxlength="255" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="projectForm.deadline"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            placeholder="未设置截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProject" @click="saveProject">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.project-detail {
  max-width: 1280px;
  margin: 0 auto;

  .surface {
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }
  .project-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) 180px auto;
    align-items: center;
    gap: 18px;
  }
  .project-title {
    min-width: 0;

    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;

      h2 {
        overflow: hidden;
        margin: 0;
        color: var(--color-text);
        font-size: 20px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    p {
      margin: 5px 0 0;
      color: var(--color-text-soft);
      font-size: 13px;
    }
  }
  .project-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: 14px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--color-text-soft);
      font-size: 12px;
    }

    strong {
      color: var(--color-text);
      font-weight: 600;
    }

    .source-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--color-primary-deep);
      font: inherit;
      cursor: pointer;

      &:disabled {
        color: var(--color-text-soft);
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }
    }
  }
  .project-progress {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 4px 10px;

    strong {
      grid-row: 1 / 3;
      color: var(--color-primary-deep);
      font-size: 20px;
    }

    span {
      color: var(--color-text-soft);
      font-size: 11px;
    }
  }
  .project-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-button) {
      border-radius: 14px;
    }
  }
  .archive-alert {
    margin-top: 16px;
  }
  .kanban {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 18px;
  }
  .kanban-column {
    min-width: 0;
    border-radius: var(--radius-card);
    background: color-mix(in srgb, var(--color-surface) 70%, var(--color-bg));
    border: 1px solid var(--color-border);
  }
  .column-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 16px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: 14px;
    font-weight: 650;

    div {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &-tail {
      gap: 6px;

      > span {
        min-width: 24px;
        padding: 2px 7px;
        border-radius: 999px;
        background: var(--color-bg);
        color: var(--color-text-soft);
        text-align: center;
        font-size: 11px;
      }
    }
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--todo {
      background: var(--color-text-soft);
    }

    &--doing {
      background: var(--color-primary);
    }

    &--done {
      background: var(--color-success);
    }
  }
  .column-body {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  .task-drop-placeholder {
    min-height: 56px;
    border: 2px dashed var(--color-primary);
    border-radius: 11px;
    background: var(--color-primary-soft);
  }
  .task-card {
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: 11px;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      opacity 0.18s ease,
      transform 0.18s ease;

    &.is-editable {
      cursor: pointer;

      &:hover,
      &:focus-visible {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-hover);
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    }

    &.is-dragging {
      opacity: 0.45;
    }

    &.is-highlighted {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
      animation: task-highlight 1.2s ease-in-out 2;
    }

    &-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;

      h3 {
        flex: 1 1 auto;
        min-width: 0;
        margin: 0;
        color: var(--color-text);
        font-size: 14px;
        line-height: 1.5;
      }
    }

    &:hover .drag-hint,
    &:focus-visible .drag-hint {
      opacity: 1;
    }

    p {
      margin: 7px 0 0;
      color: var(--color-text-soft);
      font-size: 12px;
      line-height: 1.55;
    }

    :deep(.el-select) {
      width: 100%;
    }
  }
  @keyframes task-highlight {
    50% {
      background: var(--color-primary-soft);
    }
  }
  .drag-hint {
    flex: 0 0 auto;
    color: var(--color-text-soft);
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.18s ease;
  }
  .task-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0;
  }
  .task-deadline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-soft);
    font-size: 11px;
  }
  .task-reorder {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;

    :deep(.el-button) {
      flex: 1;
      margin: 0;
    }
  }
  .dialog-footer {
    display: flex;
    align-items: center;
    gap: 8px;

    &-spacer {
      flex: 1;
    }
  }
  @media (max-width: 980px) {
    .kanban {
      grid-template-columns: 1fr;
    }
    .project-head {
      grid-template-columns: auto 1fr auto;
    }
    .project-progress {
      grid-column: 2 / 4;
    }
    .project-meta {
      gap: 8px 12px;
    }
  }
  @media (max-width: 600px) {
    .project-head {
      grid-template-columns: 1fr auto;
    }
    .project-head > :first-child {
      grid-column: 1 / 3;
      justify-self: start;
    }
    .project-progress {
      grid-column: 1 / 3;
    }
    .project-actions {
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .drag-hint {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .task-card,
    .drag-hint {
      transition: none;
    }

    .task-card.is-editable:hover,
    .task-card.is-editable:focus-visible {
      transform: none;
    }

    .task-card.is-highlighted {
      animation: none;
    }
  }
}
</style>
