<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type TagProps } from 'element-plus'
import { ArrowLeft, Calendar, Refresh } from '@element-plus/icons-vue'
import {
  getProject,
  getProjectTasks,
  updateTaskStatus,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/api/project'

const route = useRoute()
const router = useRouter()
const projectId = Number(route.params.projectId)
const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const loading = ref(true)
const errorMsg = ref('')
const updatingTaskIds = ref(new Set<number>())

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: '待办' },
  { status: 'doing', label: '进行中' },
  { status: 'done', label: '已完成' },
]

const doneCount = computed(
  () => tasks.value.filter((task) => task.status === 'done').length,
)
const progress = computed(() =>
  tasks.value.length
    ? Math.round((doneCount.value / tasks.value.length) * 100)
    : 0,
)
const readonly = computed(() => project.value?.status !== 'active')

function columnTasks(status: TaskStatus) {
  return tasks.value.filter((task) => task.status === status)
}

function priorityMeta(priority: TaskPriority): {
  label: string
  type: TagProps['type']
} {
  if (priority === 'high') return { label: '高', type: 'danger' }
  if (priority === 'low') return { label: '低', type: 'info' }
  return { label: '中', type: 'warning' }
}

function formatDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
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
        <el-button
          circle
          :icon="Refresh"
          aria-label="刷新"
          @click="loadProject"
        />
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
            <span>{{ columnTasks(column.status).length }}</span>
          </div>

          <div class="column-body">
            <article
              v-for="task in columnTasks(column.status)"
              :key="task.id"
              class="task-card"
            >
              <h3>{{ task.title }}</h3>
              <p v-if="task.description">{{ task.description }}</p>
              <div class="task-meta">
                <el-tag
                  size="small"
                  :type="priorityMeta(task.priority).type"
                  effect="plain"
                >
                  {{ priorityMeta(task.priority).label }}优先级
                </el-tag>
                <el-tag
                  v-if="task.source_type === 'ai'"
                  size="small"
                  effect="plain"
                  >AI</el-tag
                >
                <span v-if="task.deadline"
                  ><el-icon><Calendar /></el-icon
                  >{{ formatDate(task.deadline) }}</span
                >
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
.column-head > span {
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
.task-card h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.5;
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
.task-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-soft);
  font-size: 11px;
}
.task-card :deep(.el-select) {
  width: 100%;
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
}
</style>
