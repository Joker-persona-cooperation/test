<script setup lang="ts">
import {
  Bell,
  Clock,
  Document,
  FolderOpened,
  List,
  Opportunity,
  Promotion,
  Cpu,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const stats = [
  {
    label: '文档总数',
    value: 12,
    icon: Document,
    bg: '#e8f5ff',
    color: '#38a5ff',
  },
  {
    label: '解析任务',
    value: 8,
    icon: Cpu,
    bg: '#fff4e6',
    color: '#ef9f39',
  },
  {
    label: '进行中项目',
    value: 5,
    icon: FolderOpened,
    bg: '#e8faf0',
    color: '#1f9a67',
  },
  {
    label: '待办任务',
    value: 23,
    icon: List,
    bg: '#fce8e8',
    color: '#e5604c',
  },
]

const recentRecords = [
  {
    id: 1,
    title: '2026 年大学生创新创业大赛报名通知',
    source: 'pdf',
    status: 'success',
    createdAt: '2026-07-24 14:32',
  },
  {
    id: 2,
    title: '软件工程课程设计要求',
    source: 'text',
    status: 'success',
    createdAt: '2026-07-23 20:15',
  },
  {
    id: 3,
    title: '毕业设计开题报告模板说明',
    source: 'pdf',
    status: 'processing',
    createdAt: '2026-07-23 16:08',
  },
  {
    id: 4,
    title: '暑期实习项目需求文档',
    source: 'text',
    status: 'failed',
    createdAt: '2026-07-22 10:20',
  },
]

const reminders = [
  {
    id: 1,
    title: '提交项目说明书',
    project: '创新创业比赛报名',
    deadline: '2026-08-01',
    daysLeft: '2 天',
    urgent: true,
  },
  {
    id: 2,
    title: '录制演示视频',
    project: '创新创业比赛报名',
    deadline: '2026-08-03',
    daysLeft: '4 天',
    urgent: false,
  },
  {
    id: 3,
    title: '完成课程设计报告',
    project: '软件工程课程设计',
    deadline: '2026-08-05',
    daysLeft: '6 天',
    urgent: false,
  },
]

const developmentFocus = [
  '优先打通文档录入 → 解析任务 → 解析结果闭环。',
  '将当前工作台演示数据切换为后端真实接口数据。',
  '完成解析结果到项目的保存动作，再接任务管理模块。',
]

function sourceLabel(source: string) {
  return source === 'pdf' ? 'PDF' : '文本'
}

function sourceTagType(source: string) {
  return source === 'pdf' ? 'primary' : 'info'
}

function statusLabel(status: string) {
  return (
    {
      pending: '待处理',
      processing: '解析中',
      success: '已完成',
      failed: '失败',
    }[status] || status
  )
}

function statusTagType(status: string) {
  return (
    {
      pending: 'info',
      processing: 'warning',
      success: 'success',
      failed: 'danger',
    }[status] || 'info'
  )
}
</script>

<template>
  <div class="dashboard-home">
    <section class="hero-banner">
      <div class="hero-banner__content">
        <el-tag class="hero-banner__badge" effect="dark" round>
          演示数据 · 工作台首页
        </el-tag>
        <h2>
          {{ greeting }}，{{ authStore.userInfo?.nickname || 'TaskPilot 用户' }}
        </h2>
        <p>
          今天有
          {{ reminders.length }} 个任务即将到期。当前最值得优先推进的是“文档录入
          → 解析任务 → 解析结果”这条业务闭环。
        </p>
        <div class="hero-banner__actions">
          <el-button
            type="primary"
            size="large"
            round
            @click="router.push('/parse/new')"
          >
            新建解析
          </el-button>
          <el-button size="large" round @click="router.push('/projects')">
            查看项目
          </el-button>
        </div>
      </div>
      <div class="hero-banner__visual">
        <div class="hero-banner__icon-wrap">
          <el-icon :size="56"><Promotion /></el-icon>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <div
          class="stat-card__icon"
          :style="{ backgroundColor: item.bg, color: item.color }"
        >
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div>
          <p class="stat-card__value">{{ item.value }}</p>
          <p class="stat-card__label">{{ item.label }}</p>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel panel--records">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><Clock /></el-icon>
            <span>最近解析记录</span>
          </div>
          <el-button text @click="router.push('/history')">查看全部</el-button>
        </div>

        <el-table :data="recentRecords" stripe>
          <el-table-column label="标题" min-width="220">
            <template #default="{ row }">
              <button class="table-link" type="button">
                {{ row.title }}
              </button>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="96">
            <template #default="{ row }">
              <el-tag
                :type="sourceTagType(row.source)"
                effect="plain"
                size="small"
              >
                {{ sourceLabel(row.source) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="168" prop="createdAt" />
        </el-table>
      </article>

      <article class="panel panel--reminders">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><Bell /></el-icon>
            <span>今日提醒</span>
          </div>
          <el-tag type="warning" effect="plain"
            >即将到期 {{ reminders.length }}</el-tag
          >
        </div>

        <div class="reminder-list">
          <div v-for="item in reminders" :key="item.id" class="reminder-item">
            <div
              class="reminder-item__bar"
              :class="{ 'is-urgent': item.urgent }"
            />
            <div class="reminder-item__content">
              <p class="reminder-item__title">{{ item.title }}</p>
              <p class="reminder-item__meta">
                {{ item.project }} · 截止 {{ item.deadline }}
              </p>
            </div>
            <el-tag
              :type="item.urgent ? 'danger' : 'warning'"
              effect="plain"
              size="small"
            >
              {{ item.daysLeft }}
            </el-tag>
          </div>
        </div>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel panel--focus">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><Opportunity /></el-icon>
            <span>当前研发焦点</span>
          </div>
        </div>

        <h3 class="focus-title">
          文档录入 → 创建解析任务 → 轮询状态 → 查看解析结果
        </h3>
        <p class="focus-desc">
          这是当前最短、也最有价值的业务验证链路。后端对应接口已经存在，前端只需要将上传、
          状态轮询和结果页串联起来，就能完成核心闭环。
        </p>
        <ul class="focus-list">
          <li v-for="item in developmentFocus" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="panel panel--actions">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><Document /></el-icon>
            <span>快捷入口</span>
          </div>
        </div>

        <div class="shortcut-grid">
          <button
            class="shortcut-card"
            type="button"
            @click="router.push('/parse/new')"
          >
            <strong>新建解析</strong>
            <span>上传文档或粘贴文本开始处理</span>
          </button>
          <button
            class="shortcut-card"
            type="button"
            @click="router.push('/projects')"
          >
            <strong>项目管理</strong>
            <span>查看项目进度和任务状态</span>
          </button>
          <button
            class="shortcut-card"
            type="button"
            @click="router.push('/history')"
          >
            <strong>历史记录</strong>
            <span>回看历史解析与项目快照</span>
          </button>
          <button
            class="shortcut-card"
            type="button"
            @click="router.push('/profile')"
          >
            <strong>个人中心</strong>
            <span>管理账号资料与偏好设置</span>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  border-radius: var(--radius-card);
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-deep) 100%
  );
  color: #fff;
  box-shadow: 0 18px 40px rgba(31, 127, 208, 0.22);

  h2 {
    margin: 12px 0 8px;
    font-size: 28px;
    line-height: 1.2;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    opacity: 0.95;
  }

  &__content {
    max-width: 700px;
  }

  &__badge {
    --el-tag-text-color: #fff;
    --el-tag-bg-color: rgba(255, 255, 255, 0.16);
    --el-tag-border-color: rgba(255, 255, 255, 0.22);
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  &__visual {
    flex-shrink: 0;
  }

  &__icon-wrap {
    width: 116px;
    height: 116px;
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.92);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 14px;

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__value {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
  }

  &__label {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--color-text-soft);
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(300px, 1fr);
  gap: 20px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 20px;
}

.panel {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 22px 24px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
  }
}

.table-link {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.reminder-list {
  display: flex;
  flex-direction: column;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  &__bar {
    width: 6px;
    align-self: stretch;
    border-radius: 999px;
    background: var(--color-warning);
    flex-shrink: 0;
  }

  &__content {
    min-width: 0;
    flex: 1;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  &__meta {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--color-text-soft);
  }
}

.is-urgent {
  background: var(--color-danger);
}

.focus-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--color-text);
}

.focus-desc {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-soft);
}

.focus-list {
  margin: 16px 0 0;
  padding-left: 18px;
  color: var(--color-text-soft);
  line-height: 1.9;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.shortcut-card {
  border: 1px solid var(--color-border);
  background: linear-gradient(180deg, #fbfdff 0%, #f3f8fd 100%);
  border-radius: 16px;
  padding: 18px 16px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #bfdcf5;
    box-shadow: 0 14px 28px rgba(22, 50, 75, 0.08);
  }

  strong {
    display: block;
    font-size: 15px;
    color: var(--color-text);
  }

  span {
    display: block;
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-soft);
  }
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    flex-direction: column;
    align-items: flex-start;

    &__actions {
      flex-direction: column;
      width: 100%;
    }

    :deep(.el-button) {
      width: 100%;
    }
  }

  .stats-grid,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>
