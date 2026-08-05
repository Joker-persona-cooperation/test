<script setup lang="ts">
// 历史记录：对齐 goals/history.html 的「解析记录 / 项目记录」双 Tab 表格结构。
// - 解析记录：查看 -> /parse/:jobId/result（解析结果页）
// - 项目记录：查看 -> /projects/:projectId（项目详情页）
// 两个 Tab 各自分页，数据来自 /api/v1/history/*
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TagProps } from 'element-plus'
import {
  getHistoryParseResults,
  getHistoryProjectTasks,
  getHistoryProjects,
} from '@/api/history'
import type { Project } from '@/api/project'
import type { Task } from '@/api/task'
import type { ParseResult } from '@/api/parseJob'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TAG } from '@/constants/project'
import { CONFIRM_LABEL, CONFIRM_TAG } from '@/constants/parseStatus'

type TagType = TagProps['type']

const route = useRoute()
const router = useRouter()

// goals 中「解析记录」在第一个 Tab；Dashboard 跳转带 record query 时也落在该 Tab
type Tab = 'parse' | 'projects'
const activeTab = ref<Tab>(route.query.record ? 'parse' : 'parse')

const pageSize = 10

// ---- 解析记录 ----
const parseResults = ref<ParseResult[]>([])
const parseLoading = ref(false)
const parsePage = ref(1)
const parseTotal = ref(0)

// ---- 项目记录 ----
const projects = ref<Project[]>([])
const projectsLoading = ref(false)
const projectPage = ref(1)
const projectsTotal = ref(0)
// 项目任务统计：接口不返回任务数，加载时并行拉取计算（失败降级为 0）
const projectStats = ref<Map<number, { done: number; total: number }>>(
  new Map(),
)

function formatDate(value: string | null) {
  if (!value) return '未设置'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function confirmLabel(confirmed: boolean): string {
  return confirmed ? CONFIRM_LABEL.true : CONFIRM_LABEL.false
}

function confirmTag(confirmed: boolean): TagType {
  return confirmed ? CONFIRM_TAG.true : CONFIRM_TAG.false
}

async function loadParseResults() {
  parseLoading.value = true
  try {
    const data = await getHistoryParseResults(parsePage.value, pageSize)
    parseResults.value = data.items
    parseTotal.value = data.total
  } finally {
    parseLoading.value = false
  }
}

async function loadProjects() {
  projectsLoading.value = true
  try {
    const data = await getHistoryProjects(projectPage.value, pageSize)
    projects.value = data.items
    projectsTotal.value = data.total
    // 并行拉取各项目任务，计算完成进度
    const stats = new Map<number, { done: number; total: number }>()
    const results = await Promise.allSettled(
      data.items.map((item) => getHistoryProjectTasks(item.id)),
    )
    results.forEach((res, index) => {
      const project = data.items[index]
      if (res.status === 'fulfilled') {
        const tasks = res.value.items as Task[]
        stats.set(project.id, {
          done: tasks.filter((t) => t.status === 'done').length,
          total: tasks.length,
        })
      } else {
        stats.set(project.id, { done: 0, total: 0 })
      }
    })
    projectStats.value = stats
  } finally {
    projectsLoading.value = false
  }
}

function projectProgress(projectId: number): number {
  const stat = projectStats.value.get(projectId)
  if (!stat || stat.total === 0) return 0
  return Math.round((stat.done / stat.total) * 100)
}

// goals 联动：解析记录「查看」-> 解析结果页
function goParseResult(result: ParseResult) {
  router.push({
    name: 'parse-result',
    params: { jobId: result.parse_job_id },
  })
}

// goals 联动：项目记录「查看」-> 项目详情页
function goProjectDetail(project: Project) {
  router.push({
    name: 'project-detail',
    params: { projectId: project.id },
  })
}

const hasMoreProjects = computed(() => projectsTotal.value > pageSize)
const hasMoreParses = computed(() => parseTotal.value > pageSize)

function handleTabChange(tab: string | number | boolean) {
  if (tab === 'parse' && parseResults.value.length === 0) {
    void loadParseResults()
  } else if (tab === 'projects' && projects.value.length === 0) {
    void loadProjects()
  }
}

onMounted(() => {
  void loadParseResults()
})
</script>

<template>
  <div class="history-page">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 解析记录 -->
      <el-tab-pane label="解析记录" name="parse">
        <div v-loading="parseLoading" class="history-surface">
          <el-table :data="parseResults" style="width: 100%">
            <template #empty>
              <p class="history-empty">暂无解析记录。</p>
            </template>
            <el-table-column prop="title" label="标题" min-width="240" />
            <el-table-column label="确认状态" width="110">
              <template #default="{ row }: { row: ParseResult }">
                <el-tag size="small" :type="confirmTag(row.is_confirmed)">
                  {{ confirmLabel(row.is_confirmed) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="解析时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }: { row: ParseResult }">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="goParseResult(row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="hasMoreParses" class="history-pager">
            <el-pagination
              v-model:current-page="parsePage"
              :page-size="pageSize"
              :total="parseTotal"
              layout="prev, pager, next"
              background
              @current-change="loadParseResults"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 项目记录 -->
      <el-tab-pane label="项目记录" name="projects">
        <div v-loading="projectsLoading" class="history-surface">
          <el-table :data="projects" style="width: 100%">
            <template #empty>
              <p class="history-empty">暂无历史项目。</p>
            </template>
            <el-table-column prop="name" label="项目名称" min-width="200" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }: { row: Project }">
                <el-tag :type="PROJECT_STATUS_TAG[row.status]" effect="plain">
                  {{ PROJECT_STATUS_LABEL[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="任务进度" width="160">
              <template #default="{ row }: { row: Project }">
                <el-progress
                  :percentage="projectProgress(row.id)"
                  :stroke-width="6"
                  :text-inside="false"
                />
              </template>
            </el-table-column>
            <el-table-column label="截止时间" width="120">
              <template #default="{ row }: { row: Project }">
                {{ formatDate(row.deadline) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }: { row: Project }">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="goProjectDetail(row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="hasMoreProjects" class="history-pager">
            <el-pagination
              v-model:current-page="projectPage"
              :page-size="pageSize"
              :total="projectsTotal"
              layout="prev, pager, next"
              background
              @current-change="loadProjects"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.history-page {
  max-width: 1100px;
  margin: 0 auto;
}

.history-surface {
  min-height: 260px;
  padding: 22px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.history-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-soft);
}

.history-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
