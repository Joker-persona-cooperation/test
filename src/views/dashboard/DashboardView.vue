<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  Bell,
  Clock,
  Cpu,
  Document,
  FolderOpened,
  List,
} from '@element-plus/icons-vue'
import AppPanel from '@/components/common/AppPanel.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import { useAuthStore } from '@/stores/auth'
import {
  useDashboardStore,
  type DashboardParseRecord,
  type DashboardReminder,
} from '@/stores/dashboard'
import { useGreeting } from '@/composables/useGreeting'
import { formatDateTime } from '@/utils/date'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const {
  loading,
  error: loadError,
  stats: statsData,
  reminders,
  parseRecords,
} = storeToRefs(dashboardStore)
const router = useRouter()
const greeting = useGreeting()

function reloadDashboard() {
  void dashboardStore.loadDashboard()
}

const displayName = computed(
  () => authStore.userInfo?.nickname || 'TaskPilot 用户',
)

const stats = computed(() => [
  {
    label: '文档总数',
    value: statsData.value?.documents ?? 0,
    icon: Document,
    tone: 'primary' as const,
  },
  {
    label: '解析任务',
    value: statsData.value?.parseJobs ?? 0,
    icon: Cpu,
    tone: 'warning' as const,
  },
  {
    label: '进行中项目',
    value: statsData.value?.activeProjects ?? 0,
    icon: FolderOpened,
    tone: 'success' as const,
  },
  {
    label: '待办任务',
    value: statsData.value?.openTasks ?? 0,
    icon: List,
    tone: 'danger' as const,
  },
])

// 3 天内到期视为紧急，与提醒项的红色标记保持一致
const urgentCount = computed(
  () => reminders.value.filter((item) => item.daysLeft <= 3).length,
)

onMounted(dashboardStore.loadDashboard)

function openRecord(record: DashboardParseRecord) {
  router.push({
    name: 'parse-result',
    params: { jobId: record.parseJobId },
  })
}

function openReminder(reminder: DashboardReminder) {
  router.push({
    name: 'project-detail',
    params: { projectId: reminder.project_id },
    query: { task: String(reminder.id) },
  })
}
</script>

<template>
  <div class="dashboard">
    <p class="dashboard__greeting">
      {{ greeting }}，{{ displayName }}。未来 7 天有
      <strong>{{ reminders.length }}</strong> 个任务即将到期。
    </p>

    <el-result
      v-if="loadError"
      icon="error"
      title="工作台数据加载失败"
      :sub-title="loadError"
      class="dashboard__error"
    >
      <template #extra>
        <el-button type="primary" :loading="loading" @click="reloadDashboard">
          重新加载
        </el-button>
      </template>
    </el-result>

    <template v-else>
      <section class="dashboard__stats" aria-label="数据概览">
        <AppStatCard
          v-for="item in stats"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :icon="item.icon"
          :tone="item.tone"
        />
      </section>

      <div class="dashboard__grid">
      <AppPanel title="最近解析记录" :icon="Clock">
        <template #extra>
          <el-button
            text
            type="primary"
            @click="router.push({ name: 'parse-records' })"
          >
            查看全部
          </el-button>
        </template>

        <el-table
          v-loading="loading"
          :data="parseRecords"
          class="dashboard__records-table"
          style="width: 100%"
        >
          <template #empty>
            <p class="dashboard__empty">
              还没有解析记录，先去新建一个解析任务吧。
            </p>
          </template>
          <el-table-column label="标题" min-width="220">
            <template #default="{ row }: { row: DashboardParseRecord }">
              <button
                class="dashboard__record-link"
                type="button"
                @click="openRecord(row)"
              >
                {{ row.title }}
              </button>
            </template>
          </el-table-column>
          <el-table-column label="确认状态" width="110">
            <template #default="{ row }: { row: DashboardParseRecord }">
              <el-tag
                size="small"
                :type="row.confirmed ? 'success' : 'warning'"
                effect="plain"
              >
                {{ row.confirmed ? '已确认' : '待确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            width="160"
            prop="createdAt"
            align="right"
          />
        </el-table>

        <div v-loading="loading" class="dashboard__records-mobile">
          <button
            v-for="record in parseRecords.slice(0, 3)"
            :key="record.resultId"
            type="button"
            class="record-card"
            @click="openRecord(record)"
          >
            <span class="record-card__title">{{ record.title }}</span>
            <span class="record-card__meta">
              <el-tag
                size="small"
                :type="record.confirmed ? 'success' : 'warning'"
                effect="plain"
              >
                {{ record.confirmed ? '已确认' : '待确认' }}
              </el-tag>
              {{ record.createdAt }}
            </span>
          </button>
          <p v-if="!loading && !parseRecords.length" class="dashboard__empty">
            还没有解析记录，先去新建一个解析任务吧。
          </p>
        </div>
      </AppPanel>

      <AppPanel title="近期提醒" :icon="Bell">
        <template #extra>
          <el-tag v-if="urgentCount" size="small" type="danger" effect="plain">
            紧急 {{ urgentCount }}
          </el-tag>
        </template>

        <ul v-if="reminders.length" class="reminder-list">
          <li
            v-for="item in reminders"
            :key="item.id"
            class="reminder-list__item"
          >
            <button type="button" @click="openReminder(item)">
              <span
                class="reminder-list__bar"
                :class="{ 'is-urgent': item.daysLeft <= 3 }"
                aria-hidden="true"
              />
              <span class="reminder-list__body">
                <span class="reminder-list__title">{{ item.title }}</span>
                <span class="reminder-list__meta">
                  {{ item.project }} · 截止 {{ formatDateTime(item.deadline) }}
                </span>
              </span>
              <el-tag
                size="small"
                effect="plain"
                :type="item.daysLeft <= 3 ? 'danger' : 'warning'"
              >
                {{ item.daysLeft }} 天
              </el-tag>
            </button>
          </li>
        </ul>
        <p v-else class="dashboard__empty">暂无临近截止的任务。</p>
      </AppPanel>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__greeting {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-soft);

    strong {
      color: var(--color-text);
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  &__error {
    padding: 24px 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    gap: 16px;
    align-items: start;
  }

  &__record-link {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;

    &:hover {
      color: var(--color-primary-deep);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  &__records-mobile {
    display: none;
  }

  &__empty {
    margin: 0;
    padding: 8px 0;
    font-size: 13px;
    color: var(--color-text-soft);
  }
}

.reminder-list {
  margin: 0;
  padding: 0;
  list-style: none;

  &__item {
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    > button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    > button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 4px;
      border-radius: 6px;
    }
  }

  &__bar {
    width: 3px;
    align-self: stretch;
    min-height: 32px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--color-warning);

    &.is-urgent {
      background: var(--color-danger);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
  }

  &__meta {
    font-size: 12px;
    color: var(--color-text-soft);
  }
}

@media (max-width: 1180px) {
  .dashboard {
    &__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 640px) {
  .dashboard {
    &__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    &__records-table {
      display: none;
    }

    &__records-mobile {
      display: grid;
      gap: 10px;
    }
  }
}

.record-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--color-text-soft);
  }
}
</style>
