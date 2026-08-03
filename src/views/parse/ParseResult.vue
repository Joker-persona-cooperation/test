<script setup lang="ts">
// 第四步 + 第五步：解析结果页
// 第四步：只读展示 目标 / 截止时间 / 交付物 / 要求 / 风险 / 生成任务
// 第五步：确认结果 -> 保存为项目 -> 跳转项目页
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Calendar,
  Box,
  List,
  WarningFilled,
  Tickets,
} from '@element-plus/icons-vue'
import {
  getParseJobResult,
  type ParseResult,
  type ParseTask,
} from '@/api/parseJob'
import { confirmParseResult } from '@/api/parseResult'
import { createProject } from '@/api/project'

const route = useRoute()
const router = useRouter()

const jobId = Number(route.params.jobId)
const result = ref<ParseResult | null>(null)
const loading = ref(true)
const errorMsg = ref('')

// 第五步：确认 / 保存为项目的流程状态
const confirming = ref(false)
const saving = ref(false)

const priorityTag = (p?: ParseTask['priority']) => {
  switch (p) {
    case 'high':
      return { type: 'danger', text: '高' }
    case 'low':
      return { type: 'info', text: '低' }
    default:
      return { type: 'warning', text: '中' }
  }
}

const formattedDeadline = computed(() => {
  const d = result.value?.deadline
  if (!d) return '未指定'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

async function loadResult() {
  loading.value = true
  try {
    result.value = await getParseJobResult(jobId)
  } catch (e) {
    errorMsg.value =
      e instanceof Error ? e.message : '获取解析结果失败'
  } finally {
    loading.value = false
  }
}

// 第五步：先确认结果，再保存为项目（两步合一，串行调用）
async function handleSaveAsProject() {
  if (!result.value) return
  saving.value = true
  try {
    // 1) 确认解析结果
    confirming.value = true
    const confirmed = await confirmParseResult(result.value.id)
    result.value = confirmed
    confirming.value = false
    // 2) 保存为项目
    const project = await createProject({
      parse_result_id: result.value.id,
      title: result.value.goal || '未命名项目',
      deadline: result.value.deadline,
    })
    ElMessage.success(`已保存为项目：${project.title}`)
    router.push('/projects')
  } catch {
    confirming.value = false
  } finally {
    saving.value = false
  }
}

function goNew() {
  router.push('/parse/new')
}

onMounted(() => {
  if (!Number.isFinite(jobId) || jobId <= 0) {
    ElMessage.error('任务 ID 无效')
    router.replace('/parse/new')
    return
  }
  loadResult()
})
</script>

<template>
  <div class="parse-result">
    <!-- 加载中 -->
    <div v-if="loading" class="result-loading">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 加载失败 -->
    <el-result
      v-else-if="errorMsg"
      icon="error"
      title="结果加载失败"
      :sub-title="errorMsg"
    >
      <template #extra>
        <el-button type="primary" @click="goNew">重新录入</el-button>
      </template>
    </el-result>

    <!-- 结果内容 -->
    <template v-else-if="result">
      <!-- 目标 + 截止时间 概览 -->
      <section class="overview-card">
        <div class="overview-main">
          <div class="overview-label">
            <el-icon><Aim /></el-icon>
            <span>解析目标</span>
          </div>
          <h2 class="overview-goal">{{ result.goal || '未识别到明确目标' }}</h2>
        </div>
        <div class="overview-side">
          <div class="overview-item">
            <el-icon class="overview-item-icon"><Calendar /></el-icon>
            <div>
              <div class="overview-item-label">截止时间</div>
              <div class="overview-item-value">{{ formattedDeadline }}</div>
            </div>
          </div>
        </div>
      </section>

      <div class="result-grid">
        <!-- 交付物 -->
        <section class="block-card">
          <div class="block-head">
            <el-icon class="block-icon block-icon--blue"><Box /></el-icon>
            <h3>交付物</h3>
            <span class="block-count">{{ result.deliverables.length }}</span>
          </div>
          <ul v-if="result.deliverables.length" class="block-list">
            <li v-for="(item, i) in result.deliverables" :key="i">
              <span class="list-dot">{{ i + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p v-else class="block-empty">未识别到交付物</p>
        </section>

        <!-- 关键要求 -->
        <section class="block-card">
          <div class="block-head">
            <el-icon class="block-icon block-icon--green"><List /></el-icon>
            <h3>关键要求</h3>
            <span class="block-count">{{ result.requirements.length }}</span>
          </div>
          <ul v-if="result.requirements.length" class="block-list">
            <li v-for="(item, i) in result.requirements" :key="i">
              <span class="list-dot">{{ i + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p v-else class="block-empty">未识别到关键要求</p>
        </section>

        <!-- 风险提醒 -->
        <section class="block-card">
          <div class="block-head">
            <el-icon class="block-icon block-icon--orange"><WarningFilled /></el-icon>
            <h3>风险提醒</h3>
            <span class="block-count">{{ result.risks.length }}</span>
          </div>
          <ul v-if="result.risks.length" class="block-list">
            <li v-for="(item, i) in result.risks" :key="i">
              <span class="list-dot list-dot--warn">!</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p v-else class="block-empty">未识别到风险</p>
        </section>
      </div>

      <!-- 任务清单 -->
      <section class="tasks-card">
        <div class="block-head">
          <el-icon class="block-icon block-icon--blue"><Tickets /></el-icon>
          <h3>生成任务</h3>
          <span class="block-count">{{ result.tasks.length }}</span>
        </div>
        <div v-if="result.tasks.length" class="task-list">
          <div v-for="(task, i) in result.tasks" :key="task.id ?? i" class="task-item">
            <div class="task-index">{{ i + 1 }}</div>
            <div class="task-main">
              <div class="task-title">{{ task.title }}</div>
              <p v-if="task.description" class="task-desc">{{ task.description }}</p>
            </div>
            <div class="task-meta">
              <el-tag size="small" :type="priorityTag(task.priority).type">
                {{ priorityTag(task.priority).text }}
              </el-tag>
              <span v-if="task.estimated_hours" class="task-hours">
                约 {{ task.estimated_hours }}h
              </span>
            </div>
          </div>
        </div>
        <p v-else class="block-empty">未生成任务</p>
      </section>

      <!-- 第五步：确认结果 -> 保存为项目 -->
      <section class="result-footer">
        <div class="footer-tip">
          <span v-if="result.confirmed" class="confirmed-badge">已确认</span>
          <span>确认解析结果无误后，可保存为项目并进入任务管理。</span>
        </div>
        <div class="footer-actions">
          <el-button @click="goNew">重新解析</el-button>
          <el-button
            type="primary"
            :loading="saving"
            :disabled="result.confirmed"
            @click="handleSaveAsProject"
          >
            {{ saving
              ? (confirming ? '确认中...' : '保存中...')
              : result.confirmed ? '已保存为项目' : '确认并保存为项目' }}
          </el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.parse-result {
  max-width: 920px;
}

.result-loading {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 32px;
}

/* 概览卡 */
.overview-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 28px 32px;
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.overview-main {
  flex: 1;
  min-width: 0;

  .overview-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-soft);
    margin-bottom: 8px;
  }

  .overview-goal {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--color-text);
  }
}

.overview-side {
  flex-shrink: 0;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;

  &-icon {
    font-size: 20px;
    color: var(--color-primary);
  }

  &-label {
    font-size: 12px;
    color: var(--color-text-soft);
  }

  &-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }
}

/* 区块网格 */
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.block-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 24px;
}

.block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }

  .block-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--color-text-soft);
    background: var(--color-bg);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.block-icon {
  font-size: 18px;

  &--blue {
    color: var(--color-primary);
  }

  &--green {
    color: var(--color-success);
  }

  &--orange {
    color: var(--color-warning);
  }
}

.block-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);

    & + li {
      border-top: 1px dashed var(--color-border);
    }
  }
}

.list-dot {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;

  &--warn {
    background: rgba(239, 159, 57, 0.15);
    color: var(--color-warning);
  }
}

.block-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-soft);
}

/* 任务清单 */
.tasks-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 24px;
  margin-bottom: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow-card);
  }
}

.task-index {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-primary-deep)
  );
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-main {
  flex: 1;
  min-width: 0;

  .task-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.5;
  }

  .task-desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--color-text-soft);
    line-height: 1.6;
  }
}

.task-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;

  .task-hours {
    font-size: 12px;
    color: var(--color-text-soft);
  }
}

/* 底部操作 */
.result-footer {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .footer-tip {
    font-size: 13px;
    color: var(--color-text-soft);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .confirmed-badge {
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(31, 154, 103, 0.12);
    color: var(--color-success);
    font-size: 12px;
    font-weight: 600;
  }

  .footer-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
