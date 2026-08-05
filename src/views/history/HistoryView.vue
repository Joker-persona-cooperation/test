<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { TagProps } from 'element-plus'
import AppPanel from '@/components/common/AppPanel.vue'
import {
  useHistoryStore,
  type ParseResult,
  type Project,
} from '@/stores/history'
import { CONFIRM_LABEL, CONFIRM_TAG } from '@/constants/parseStatus'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TAG } from '@/constants/project'
import { formatDateTime } from '@/utils/date'

type HistoryTab = 'parse' | 'projects'
type TagType = TagProps['type']

const route = useRoute()
const router = useRouter()
const historyStore = useHistoryStore()
const {
  parseResults,
  parseTotal,
  parseLoading,
  projects,
  projectTotal,
  projectLoading,
} = storeToRefs(historyStore)
const pageSize = 10

const activeTab = computed<HistoryTab>(() =>
  route.query.tab === 'projects' ? 'projects' : 'parse',
)
const currentPage = computed(() => {
  const value = Number(route.query.page)
  return Number.isInteger(value) && value > 0 ? value : 1
})

function confirmLabel(confirmed: boolean) {
  return confirmed ? CONFIRM_LABEL.true : CONFIRM_LABEL.false
}

function confirmTag(confirmed: boolean): TagType {
  return confirmed ? CONFIRM_TAG.true : CONFIRM_TAG.false
}

async function loadActiveTab() {
  if (activeTab.value === 'projects') {
    await historyStore.loadProjects(currentPage.value, pageSize)
    return
  }
  await historyStore.loadParseResults(currentPage.value, pageSize)
}

function changeTab(tab: string | number) {
  void router.push({
    name: 'parse-records',
    query: tab === 'projects' ? { tab: 'projects' } : undefined,
  })
}

function changePage(page: number) {
  void router.push({
    name: 'parse-records',
    query: {
      ...(activeTab.value === 'projects' ? { tab: 'projects' } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
    },
  })
}

function openParseResult(result: ParseResult) {
  void router.push({
    name: 'parse-result',
    params: { jobId: result.parse_job_id },
  })
}

function openProject(project: Project) {
  void router.push({
    name: 'project-detail',
    params: { projectId: project.id },
    query: { mode: 'history', status: project.status },
  })
}

watch([activeTab, currentPage], loadActiveTab)
onMounted(loadActiveTab)
</script>

<template>
  <div class="history-page">
    <el-tabs :model-value="activeTab" @tab-change="changeTab">
      <el-tab-pane label="解析记录" name="parse">
        <AppPanel title="解析记录">
          <div v-loading="parseLoading">
            <el-table
              :data="parseResults"
              class="history-page__table"
              style="width: 100%"
            >
              <template #empty>
                <p class="history-page__empty">暂无解析记录。</p>
              </template>
              <el-table-column prop="title" label="标题" min-width="260" />
              <el-table-column label="确认状态" width="120">
                <template #default="{ row }: { row: ParseResult }">
                  <el-tag
                    size="small"
                    :type="confirmTag(row.is_confirmed)"
                    effect="plain"
                  >
                    {{ confirmLabel(row.is_confirmed) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="解析时间" width="180">
                <template #default="{ row }: { row: ParseResult }">
                  {{ formatDateTime(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="right">
                <template #default="{ row }: { row: ParseResult }">
                  <el-button
                    text
                    type="primary"
                    size="small"
                    @click="openParseResult(row)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="history-page__mobile-list">
              <button
                v-for="result in parseResults"
                :key="result.id"
                type="button"
                class="history-record-card"
                @click="openParseResult(result)"
              >
                <strong>{{ result.title }}</strong>
                <span>
                  <el-tag
                    size="small"
                    :type="confirmTag(result.is_confirmed)"
                    effect="plain"
                  >
                    {{ confirmLabel(result.is_confirmed) }}
                  </el-tag>
                  {{ formatDateTime(result.created_at) }}
                </span>
              </button>
              <p
                v-if="!parseLoading && !parseResults.length"
                class="history-page__empty"
              >
                暂无解析记录。
              </p>
            </div>

            <el-pagination
              v-if="parseTotal > pageSize"
              class="history-page__pager"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="parseTotal"
              layout="prev, pager, next"
              background
              @current-change="changePage"
            />
          </div>
        </AppPanel>
      </el-tab-pane>

      <el-tab-pane label="项目记录" name="projects">
        <AppPanel title="项目记录">
          <div v-loading="projectLoading">
            <el-table
              :data="projects"
              class="history-page__table"
              style="width: 100%"
            >
              <template #empty>
                <p class="history-page__empty">暂无项目记录。</p>
              </template>
              <el-table-column prop="name" label="项目名称" min-width="240" />
              <el-table-column label="状态" width="110">
                <template #default="{ row }: { row: Project }">
                  <el-tag
                    size="small"
                    :type="PROJECT_STATUS_TAG[row.status]"
                    effect="plain"
                  >
                    {{ PROJECT_STATUS_LABEL[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="180">
                <template #default="{ row }: { row: Project }">
                  {{ formatDateTime(row.updated_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="right">
                <template #default="{ row }: { row: Project }">
                  <el-button
                    text
                    type="primary"
                    size="small"
                    @click="openProject(row)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="history-page__mobile-list">
              <button
                v-for="project in projects"
                :key="project.id"
                type="button"
                class="history-record-card"
                @click="openProject(project)"
              >
                <strong>{{ project.name }}</strong>
                <span>
                  <el-tag
                    size="small"
                    :type="PROJECT_STATUS_TAG[project.status]"
                    effect="plain"
                  >
                    {{ PROJECT_STATUS_LABEL[project.status] }}
                  </el-tag>
                  {{ formatDateTime(project.updated_at) }}
                </span>
              </button>
              <p
                v-if="!projectLoading && !projects.length"
                class="history-page__empty"
              >
                暂无项目记录。
              </p>
            </div>

            <el-pagination
              v-if="projectTotal > pageSize"
              class="history-page__pager"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="projectTotal"
              layout="prev, pager, next"
              background
              @current-change="changePage"
            />
          </div>
        </AppPanel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.history-page {
  max-width: 1100px;
  margin: 0 auto;

  &__mobile-list {
    display: none;
  }

  &__empty {
    margin: 0;
    padding: 8px 0;
    color: var(--color-text-soft);
    font-size: 13px;
  }

  &__pager {
    justify-content: flex-end;
    margin-top: 18px;
  }
}

.history-record-card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  strong {
    color: var(--color-text);
    font-size: 14px;
  }

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-soft);
    font-size: 12px;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

@media (max-width: 640px) {
  .history-page {
    &__table {
      display: none;
    }

    &__mobile-list {
      display: grid;
      gap: 10px;
    }

    &__pager {
      justify-content: center;
    }
  }
}
</style>
