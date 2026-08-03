<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  Delete,
  EditPen,
  Plus,
  Refresh,
} from '@element-plus/icons-vue'
import { isApiError } from '@/api/errors'
import { getProject, type Project } from '@/api/project'
import {
  createTask,
  deleteTask,
  getProjectTasks,
  reorderTasks,
  updateTask,
  updateTaskStatus,
  type ReorderTaskItem,
  type Task,
} from '@/api/task'
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_OPTIONS,
  TASK_PRIORITY_TAG,
  TASK_STATUS_COLUMNS as columns,
  type TaskPriority,
  type TaskStatus,
} from '@/constants/task'

const route = useRoute()
const router = useRouter()
const projectId = Number(route.params.projectId)
const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const loading = ref(true)
const errorMsg = ref('')
// 状态切换中的任务 id，用于禁用对应卡片的下拉
const updatingTaskIds = ref(new Set<number>())
// 排序请求进行中的任务 id，避免连点造成顺序错乱
const reorderingIds = ref(new Set<number>())

const doneCount = computed(
  () => tasks.value.filter((task) => task.status === 'done').length,
)
const progress = computed(() =>
  tasks.value.length
    ? Math.round((doneCount.value / tasks.value.length) * 100)
    : 0,
)
const readonly = computed(() => project.value?.status !== 'active')

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

function isFirstInColumn(task: Task) {
  const list = columnTasks(task.status)
  return list.length > 0 && list[0].id === task.id
}

function isLastInColumn(task: Task) {
  const list = columnTasks(task.status)
  return list.length > 0 && list[list.length - 1].id === task.id
}

function formatDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
}

async function loadProjectTasks() {
  // 排序回滚 / 乐观锁冲突后只刷新任务，不重载整页项目信息
  try {
    const data = await getProjectTasks(projectId)
    tasks.value = data.items
  } catch {
    // 静默：整页加载由 loadProject 兜底提示
  }
}

async function loadProject() {
  loading.value = true
  errorMsg.value = ''
  try {
    const [projectData, taskData] = await Promise.all([
      getProject(projectId),
      getProjectTasks(projectId),
    ])
    project.value = projectData
    tasks.value = taskData.items
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '项目加载失败'
  } finally {
    loading.value = false
  }
}

async function changeStatus(task: Task, status: TaskStatus) {
  if (task.status === status || updatingTaskIds.value.has(task.id)) return
  const previousStatus = task.status
  task.status = status
  updatingTaskIds.value.add(task.id)
  try {
    const updated = await updateTaskStatus(task.id, status)
    const index = tasks.value.findIndex((item) => item.id === task.id)
    if (index >= 0) tasks.value[index] = updated
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

async function saveTask() {
  const title = form.title.trim()
  if (!title) {
    ElMessage.warning('请输入任务标题')
    return
  }
  savingTask.value = true
  try {
    if (dialogMode.value === 'create') {
      const created = await createTask(projectId, {
        title,
        description: form.description.trim() || null,
        priority: form.priority,
        deadline: form.deadline || null,
        status: form.status,
      })
      tasks.value.push(created)
      ElMessage.success('任务已添加')
      dialogVisible.value = false
    } else {
      const id = form.id
      if (!id) return
      const updated = await updateTask(id, {
        version: form.version,
        title,
        description: form.description.trim() || null,
        priority: form.priority,
        deadline: form.deadline || null,
        status: form.status,
      })
      const index = tasks.value.findIndex((item) => item.id === updated.id)
      if (index >= 0) tasks.value[index] = updated
      ElMessage.success('任务已更新')
      dialogVisible.value = false
    }
  } catch (error) {
    // 乐观锁冲突（code 10007）：刷新任务列表拿到最新 version 后让用户重试
    if (isApiError(error) && error.code === 10007) {
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
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  removingTask.value = true
  try {
    await deleteTask(form.id)
    tasks.value = tasks.value.filter((item) => item.id !== form.id)
    ElMessage.success('任务已删除')
    dialogVisible.value = false
  } catch {
    // 失败时 client.ts 已弹出错误，保留弹窗供重试
  } finally {
    removingTask.value = false
  }
}

async function moveTask(task: Task, direction: 'up' | 'down') {
  if (readonly.value || reorderingIds.value.has(task.id)) return
  const list = columnTasks(task.status)
  const index = list.findIndex((item) => item.id === task.id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= list.length) return
  // 交换相邻位置：list 内是同一批任务对象引用，调整数组顺序后据此重排
  ;[list[index], list[target]] = [list[target], list[index]]

  // 用全局递增 sort_order 重排全量任务，保证服务端按列或全局排序都一致
  let order = 0
  const payload: ReorderTaskItem[] = []
  for (const col of columns) {
    // 当前列用已交换顺序的 list，其它列按各自现有顺序展开
    const colList = col.status === task.status ? list : columnTasks(col.status)
    for (const item of colList) {
      item.sort_order = order++
      payload.push({ id: item.id, sort_order: item.sort_order })
    }
  }
  reorderingIds.value.add(task.id)
  try {
    await reorderTasks({ tasks: payload })
  } catch {
    // 服务端拒绝或网络失败：拉回服务端权威顺序
    await loadProjectTasks()
  } finally {
    reorderingIds.value.delete(task.id)
  }
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
        <el-button @click="router.push({ name: 'projects' })"
          >返回项目列表</el-button
        >
        <el-button type="primary" @click="loadProject">重新加载</el-button>
      </template>
    </el-result>

    <template v-else-if="project">
      <section class="surface project-head">
        <el-button
          text
          :icon="ArrowLeft"
          @click="router.push({ name: 'projects' })"
          >项目列表</el-button
        >
        <div class="project-title">
          <div class="title-row">
            <h2>{{ project.name }}</h2>
            <el-tag
              :type="project.status === 'active' ? 'success' : 'info'"
              effect="plain"
            >
              {{ project.status === 'active' ? '进行中' : '已归档' }}
            </el-tag>
          </div>
          <p>{{ project.description || '管理由解析结果生成的任务清单。' }}</p>
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
        title="已归档项目为只读状态，恢复项目后才能修改任务。"
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

          <div class="column-body">
            <article
              v-for="task in columnTasks(column.status)"
              :key="task.id"
              class="task-card"
            >
              <div class="task-card-head">
                <h3>{{ task.title }}</h3>
                <div v-if="!readonly" class="task-card-actions">
                  <el-button
                    circle
                    size="small"
                    :icon="ArrowUp"
                    :disabled="
                      reorderingIds.has(task.id) || isFirstInColumn(task)
                    "
                    aria-label="上移"
                    @click="moveTask(task, 'up')"
                  />
                  <el-button
                    circle
                    size="small"
                    :icon="ArrowDown"
                    :disabled="
                      reorderingIds.has(task.id) || isLastInColumn(task)
                    "
                    aria-label="下移"
                    @click="moveTask(task, 'down')"
                  />
                  <el-button
                    circle
                    size="small"
                    :icon="EditPen"
                    :disabled="reorderingIds.has(task.id)"
                    aria-label="编辑任务"
                    @click="openEdit(task)"
                  />
                </div>
              </div>
              <p v-if="task.description">{{ task.description }}</p>
              <div class="task-meta">
                <el-tag
                  size="small"
                  :type="TASK_PRIORITY_TAG[task.priority]"
                  effect="plain"
                >
                  {{ TASK_PRIORITY_LABEL[task.priority] }}优先级
                </el-tag>
                <el-tag
                  v-if="task.source_type === 'ai'"
                  size="small"
                  effect="plain"
                  >AI</el-tag
                >
                <span v-if="task.deadline" class="task-deadline">
                  <el-icon><Calendar /></el-icon>{{ formatDate(task.deadline) }}
                </span>
              </div>
              <el-select
                :model-value="task.status"
                size="small"
                :disabled="readonly || updatingTaskIds.has(task.id)"
                :loading="updatingTaskIds.has(task.id)"
                @change="changeStatus(task, $event as TaskStatus)"
              >
                <el-option
                  v-for="option in columns"
                  :key="option.status"
                  :label="option.label"
                  :value="option.status"
                />
              </el-select>
            </article>
            <el-empty
              v-if="columnTasks(column.status).length === 0"
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
      width="480px"
      :close-on-click-modal="false"
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
  </div>
</template>

<style lang="scss" scoped>
.project-detail {
  max-width: 1280px;
  margin: 0 auto;
}
.surface {
  padding: 20px;
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
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-row h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-title p {
  margin: 5px 0 0;
  color: var(--color-text-soft);
  font-size: 13px;
}
.project-progress {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4px 10px;
}
.project-progress strong {
  grid-row: 1 / 3;
  color: var(--color-primary-deep);
  font-size: 20px;
}
.project-progress span {
  color: var(--color-text-soft);
  font-size: 11px;
}
.project-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
}
.column-head div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.column-head-tail {
  display: flex;
  align-items: center;
  gap: 6px;
}
.column-head-tail > span {
  min-width: 24px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text-soft);
  text-align: center;
  font-size: 11px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot--todo {
  background: var(--color-text-soft);
}
.status-dot--doing {
  background: var(--color-primary);
}
.status-dot--done {
  background: var(--color-success);
}
.column-body {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}
.task-card {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  box-shadow: 0 3px 12px rgba(22, 50, 75, 0.06);
}
.task-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.task-card-head h3 {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.5;
}
.task-card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.task-card p {
  margin: 7px 0 0;
  color: var(--color-text-soft);
  font-size: 12px;
  line-height: 1.55;
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
.task-card :deep(.el-select) {
  width: 100%;
}
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dialog-footer-spacer {
  flex: 1;
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
}
</style>
