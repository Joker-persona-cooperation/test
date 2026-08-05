<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, FolderOpened, Plus } from '@element-plus/icons-vue'
import AppPanel from '@/components/common/AppPanel.vue'
import {
  useProjectStore,
  type ParseResult,
  type Project,
} from '@/stores/project'
import type { ProjectStatus } from '@/constants/project'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const {
  projects,
  total,
  listLoading: loading,
  listError: errorMsg,
} = storeToRefs(projectStore)
const status = ref<ProjectStatus>(readStatus(route.query.status))
const page = ref(readPage(route.query.page))
const pageSize = 12
const createDialogVisible = ref(false)
const parseResults = ref<ParseResult[]>([])
const loadingResults = ref(false)
const creatingProject = ref(false)
const selectedResultId = ref<number | null>(null)

const selectedResult = computed(() =>
  parseResults.value.find((item) => item.id === selectedResultId.value),
)
const emptyDescription = computed(() => {
  if (status.value === 'active') return '暂无进行中项目'
  if (status.value === 'archived') return '暂无已归档项目'
  return '暂无已删除项目'
})
const panelTitle = computed(() =>
  status.value === 'deleted' ? '已删除项目' : '项目列表',
)

function readStatus(value: unknown): ProjectStatus {
  return value === 'archived' || value === 'deleted' ? value : 'active'
}

function readPage(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

async function syncQuery(nextStatus: ProjectStatus, nextPage = 1) {
  await router.push({
    name: 'projects',
    query: {
      status: nextStatus,
      ...(nextPage > 1 ? { page: String(nextPage) } : {}),
    },
  })
}

async function loadProjects() {
  await projectStore.loadProjects(status.value, page.value, pageSize)
}

async function openCreateDialog() {
  createDialogVisible.value = true
  loadingResults.value = true
  selectedResultId.value = null
  try {
    parseResults.value = await projectStore.loadAvailableParseResults()
  } finally {
    loadingResults.value = false
  }
}

async function handleCreateProject() {
  if (!selectedResult.value) {
    ElMessage.warning('请选择一条解析结果')
    return
  }
  creatingProject.value = true
  try {
    const created = await projectStore.createFromResult(selectedResult.value)
    ElMessage.success(`项目「${created.project.name}」已创建`)
    createDialogVisible.value = false
    await router.push({
      name: 'project-detail',
      params: { projectId: created.project.id },
    })
  } finally {
    creatingProject.value = false
  }
}

function openProject(project: Project) {
  void router.push({
    name: 'project-detail',
    params: { projectId: project.id },
    query:
      project.status === 'deleted'
        ? { mode: 'history', status: 'deleted' }
        : undefined,
  })
}

watch(
  () => [route.query.status, route.query.page],
  () => {
    status.value = readStatus(route.query.status)
    page.value = readPage(route.query.page)
    void loadProjects()
  },
)

onMounted(loadProjects)
</script>

<template>
  <div class="projects-page">
    <div class="projects-page__toolbar">
      <el-segmented
        :model-value="status"
        :options="[
          { label: '进行中', value: 'active' },
          { label: '已归档', value: 'archived' },
          { label: '已删除', value: 'deleted' },
        ]"
        @change="syncQuery($event as ProjectStatus)"
      />
      <el-button
        v-if="status !== 'deleted'"
        type="primary"
        :icon="Plus"
        @click="openCreateDialog"
      >
        新建项目
      </el-button>
    </div>

    <el-alert
      v-if="status === 'deleted'"
      title="已删除项目仅用于审计和回溯，不支持恢复或再次编辑。"
      type="info"
      :closable="false"
      class="projects-page__history-alert"
    />

    <AppPanel
      v-loading="loading"
      :title="panelTitle"
      class="projects-page__surface"
    >
      <el-result
        v-if="errorMsg"
        icon="error"
        title="项目加载失败"
        :sub-title="errorMsg"
      >
        <template #extra>
          <el-button type="primary" @click="loadProjects">重新加载</el-button>
        </template>
      </el-result>

      <el-empty
        v-else-if="!loading && projects.length === 0"
        :description="emptyDescription"
      >
        <el-button
          v-if="status === 'active'"
          type="primary"
          @click="router.push({ name: 'parse-create' })"
        >
          新建解析
        </el-button>
      </el-empty>

      <div v-else class="projects-page__grid">
        <button
          v-for="project in projects"
          :key="project.id"
          type="button"
          class="project-card"
          @click="openProject(project)"
        >
          <span class="project-card__icon">
            <el-icon><FolderOpened /></el-icon>
          </span>
          <span class="project-card__main">
            <span class="project-card__title-row">
              <strong>{{ project.name }}</strong>
              <el-tag
                v-if="project.status === 'deleted'"
                size="small"
                type="info"
              >
                只读
              </el-tag>
            </span>
            <span>{{ project.description || '由解析结果生成的任务项目' }}</span>
          </span>
          <span class="project-card__deadline">
            <el-icon><Calendar /></el-icon>
            {{
              project.deadline ? formatDate(project.deadline) : '未设置截止时间'
            }}
          </span>
        </button>
      </div>

      <el-pagination
        v-if="total > pageSize"
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        class="projects-page__pagination"
        @current-change="syncQuery(status, $event)"
      />
    </AppPanel>

    <el-dialog
      v-model="createDialogVisible"
      title="从解析结果新建项目"
      width="min(560px, calc(100vw - 32px))"
      class="rounded-dialog"
    >
      <div v-loading="loadingResults" class="result-picker">
        <el-empty
          v-if="!loadingResults && parseResults.length === 0"
          :image-size="64"
          description="暂无可创建项目的已确认解析结果"
        />
        <el-radio-group v-else v-model="selectedResultId">
          <el-radio
            v-for="resultItem in parseResults"
            :key="resultItem.id"
            :value="resultItem.id"
            border
          >
            <span class="result-picker__option">
              <strong>{{ resultItem.title }}</strong>
              <small>{{ formatDate(resultItem.created_at) }}</small>
            </span>
          </el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedResultId"
          :loading="creatingProject"
          @click="handleCreateProject"
        >
          创建项目
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.projects-page {
  max-width: 1100px;
  margin: 0 auto;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;

    :deep(.el-button) {
      border-radius: 14px;
    }
  }

  &__history-alert {
    margin-bottom: 16px;
  }

  &__surface {
    min-height: 260px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 14px;
  }

  &__pagination {
    justify-content: center;
    margin-top: 22px;
  }
}

.project-card {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s,
    box-shadow 0.18s,
    transform 0.18s;

  &:hover,
  &:focus-visible {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &__icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--color-primary-soft);
    color: var(--color-primary-deep);
    font-size: 20px;
  }

  &__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;

    strong,
    > span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: var(--color-text);
      font-size: 15px;
    }

    > span:last-child {
      color: var(--color-text-soft);
      font-size: 12px;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__deadline {
    grid-column: 2;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-text-soft);
    font-size: 12px;
  }
}

.result-picker {
  min-height: 160px;

  :deep(.el-radio-group) {
    width: 100%;
    display: grid;
    gap: 10px;
  }

  :deep(.el-radio) {
    width: 100%;
    height: auto;
    margin: 0;
    padding: 13px 14px;
    border-radius: 12px;
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      color: var(--color-text);
      font-weight: 600;
    }

    small {
      color: var(--color-text-soft);
    }
  }
}

@media (max-width: 600px) {
  .projects-page {
    &__toolbar {
      align-items: stretch;
      flex-direction: column;

      :deep(.el-segmented) {
        width: 100%;
      }
    }

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    transition: none;

    &:hover,
    &:focus-visible {
      transform: none;
    }
  }
}
</style>
