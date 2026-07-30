<script setup lang="ts">
import { computed } from 'vue'
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
import { useGreeting } from '@/composables/useGreeting'
import {
  DOCUMENT_SOURCE_LABEL,
  PARSE_STATUS_LABEL,
  PARSE_STATUS_TAG,
} from '@/constants/parseStatus'
import {
  mockParseRecords,
  mockReminders,
  mockStats,
  type DashboardParseRecord,
} from '@/mocks/dashboard'

const authStore = useAuthStore()
const router = useRouter()
const greeting = useGreeting()

const displayName = computed(
  () => authStore.userInfo?.nickname || 'TaskPilot 用户',
)

const stats = computed(() => [
  {
    label: '文档总数',
    value: mockStats.documents,
    icon: Document,
    tone: 'primary' as const,
  },
  {
    label: '解析任务',
    value: mockStats.parseJobs,
    icon: Cpu,
    tone: 'warning' as const,
  },
  {
    label: '进行中项目',
    value: mockStats.activeProjects,
    icon: FolderOpened,
    tone: 'success' as const,
  },
  {
    label: '待办任务',
    value: mockStats.openTasks,
    icon: List,
    tone: 'danger' as const,
  },
])

// 3 天内到期视为紧急，与提醒项的红色标记保持一致
const urgentCount = computed(
  () => mockReminders.filter((item) => item.daysLeft <= 3).length,
)

function openRecord(id: number) {
  // 解析详情页尚未落地，先落到历史列表，避免死链
  router.push({ name: 'history', query: { record: String(id) } })
}
</script>

<template>
  <div class="dashboard">
    <p class="dashboard__greeting">
      {{ greeting }}，{{ displayName }}。今天有
      <strong>{{ mockReminders.length }}</strong> 个任务即将到期。
    </p>

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
            @click="router.push({ name: 'history' })"
          >
            查看全部
          </el-button>
        </template>

        <el-table :data="mockParseRecords" style="width: 100%">
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
                @click="openRecord(row.id)"
              >
                {{ row.title }}
              </button>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="90">
            <template #default="{ row }: { row: DashboardParseRecord }">
              <el-tag size="small" effect="plain">
                {{ DOCUMENT_SOURCE_LABEL[row.source] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }: { row: DashboardParseRecord }">
              <el-tag size="small" :type="PARSE_STATUS_TAG[row.status]">
                {{ PARSE_STATUS_LABEL[row.status] }}
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
      </AppPanel>

      <AppPanel title="今日提醒" :icon="Bell">
        <template #extra>
          <el-tag v-if="urgentCount" size="small" type="danger" effect="plain">
            紧急 {{ urgentCount }}
          </el-tag>
        </template>

        <ul v-if="mockReminders.length" class="reminder-list">
          <li
            v-for="item in mockReminders"
            :key="item.id"
            class="reminder-list__item"
          >
            <span
              class="reminder-list__bar"
              :class="{ 'is-urgent': item.daysLeft <= 3 }"
              aria-hidden="true"
            />
            <span class="reminder-list__body">
              <span class="reminder-list__title">{{ item.title }}</span>
              <span class="reminder-list__meta">
                {{ item.project }} · 截止 {{ item.deadline }}
              </span>
            </span>
            <el-tag
              size="small"
              effect="plain"
              :type="item.daysLeft <= 3 ? 'danger' : 'warning'"
            >
              {{ item.daysLeft }} 天
            </el-tag>
          </li>
        </ul>
        <p v-else class="dashboard__empty">暂无临近截止的任务。</p>
      </AppPanel>
    </div>
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
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
      border-bottom: 0;
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
  .dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
