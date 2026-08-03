<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type TagProps } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import {
  getParseJobResult,
  type ParseResult,
  type ParseTask,
} from '@/api/parseJob'
import {
  confirmParseResult,
  updateParseResult,
  type UpdateParseResultParams,
} from '@/api/parseResult'
import { createProject } from '@/api/project'

const route = useRoute()
const router = useRouter()
const jobId = Number(route.params.jobId)

const result = ref<ParseResult | null>(null)
const loading = ref(true)
const saving = ref(false)
const confirming = ref(false)
const creatingProject = ref(false)
const errorMsg = ref('')

const editable = computed(() =>
  Boolean(result.value && !result.value.is_confirmed),
)

function priorityTag(priority?: ParseTask['priority']): {
  type: TagProps['type']
  text: string
} {
  if (priority === 'high') return { type: 'danger', text: '高' }
  if (priority === 'low') return { type: 'info', text: '低' }
  return { type: 'warning', text: '中' }
}

function addListItem(
  field: 'deliverables' | 'key_requirements' | 'risk_warnings',
) {
  result.value?.[field].push('')
}

function addTask() {
  result.value?.generated_tasks.push({
    title: '',
    description: null,
    priority: 'medium',
    deadline: null,
  })
}

function buildUpdateParams(): UpdateParseResultParams | null {
  if (!result.value) return null

  const title = result.value.title.trim()
  const summary = result.value.summary.trim()
  const generatedTasks = result.value.generated_tasks.map((task) => ({
    title: task.title.trim(),
    description: task.description?.trim() || null,
    priority: task.priority || 'medium',
    deadline: task.deadline || null,
  }))

  if (!title || !summary) {
    ElMessage.warning('标题和摘要不能为空')
    return null
  }
  if (generatedTasks.some((task) => !task.title)) {
    ElMessage.warning('任务标题不能为空')
    return null
  }

  return {
    version: result.value.version,
    title,
    summary,
    deadline: result.value.deadline || null,
    deliverables: result.value.deliverables
      .map((item) => item.trim())
      .filter(Boolean),
    key_requirements: result.value.key_requirements
      .map((item) => item.trim())
      .filter(Boolean),
    risk_warnings: result.value.risk_warnings
      .map((item) => item.trim())
      .filter(Boolean),
    generated_tasks: generatedTasks,
  }
}

async function loadResult() {
  loading.value = true
  errorMsg.value = ''
  try {
    result.value = await getParseJobResult(jobId)
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '获取解析结果失败'
  } finally {
    loading.value = false
  }
}

async function saveChanges(showSuccess = true) {
  if (!result.value || result.value.is_confirmed) return result.value
  const params = buildUpdateParams()
  if (!params) return null

  saving.value = true
  try {
    result.value = await updateParseResult(result.value.id, params)
    if (showSuccess) ElMessage.success('解析结果已保存')
    return result.value
  } catch {
    return null
  } finally {
    saving.value = false
  }
}

async function handleConfirm() {
  if (!result.value || result.value.is_confirmed) return
  confirming.value = true
  try {
    const saved = await saveChanges(false)
    if (!saved) return
    result.value = await confirmParseResult(saved.id)
    ElMessage.success('解析结果已确认')
  } finally {
    confirming.value = false
  }
}

async function handleSaveAsProject() {
  if (!result.value) return
  creatingProject.value = true
  try {
    if (!result.value.is_confirmed) {
      const saved = await saveChanges(false)
      if (!saved) return
      result.value = await confirmParseResult(saved.id)
    }

    const created = await createProject({
      parse_result_id: result.value.id,
      name: result.value.title,
    })
    ElMessage.success(`项目「${created.project.name}」已就绪`)
    await router.push({
      name: 'project-detail',
      params: { projectId: created.project.id },
    })
  } finally {
    creatingProject.value = false
  }
}

onMounted(() => {
  if (!Number.isInteger(jobId) || jobId <= 0) {
    ElMessage.error('任务 ID 无效')
    router.replace({ name: 'parse-create' })
    return
  }
  loadResult()
})
</script>

<template>
  <div class="parse-result">
    <div v-if="loading" class="card"><el-skeleton :rows="10" animated /></div>

    <el-result
      v-else-if="errorMsg"
      icon="error"
      title="结果加载失败"
      :sub-title="errorMsg"
    >
      <template #extra>
        <el-button @click="router.push({ name: 'parse-create' })"
          >重新录入</el-button
        >
        <el-button type="primary" @click="loadResult">重新加载</el-button>
      </template>
    </el-result>

    <template v-else-if="result">
      <section class="card result-head">
        <div>
          <div class="eyebrow">
            <el-tag
              :type="result.is_confirmed ? 'success' : 'warning'"
              effect="plain"
            >
              {{ result.is_confirmed ? '已确认' : '待确认' }}
            </el-tag>
            <span>版本 v{{ result.version }}</span>
            <span v-if="result.ai_model">模型 {{ result.ai_model }}</span>
          </div>
          <h2>{{ result.title }}</h2>
        </div>
        <el-date-picker
          v-model="result.deadline"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          placeholder="未指定截止时间"
          :disabled="!editable"
        />
      </section>

      <section class="card edit-card">
        <div class="field">
          <label>项目标题</label>
          <el-input
            v-model="result.title"
            maxlength="255"
            :disabled="!editable"
          />
        </div>
        <div class="field">
          <label>解析摘要</label>
          <el-input
            v-model="result.summary"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
            :disabled="!editable"
          />
        </div>

        <div
          v-for="section in [
            { field: 'deliverables', title: '交付物' },
            { field: 'key_requirements', title: '关键要求' },
            { field: 'risk_warnings', title: '风险提醒' },
          ] as const"
          :key="section.field"
          class="field"
        >
          <div class="field-head">
            <label>{{ section.title }}</label>
            <el-button
              v-if="editable"
              text
              type="primary"
              :icon="Plus"
              @click="addListItem(section.field)"
              >添加</el-button
            >
          </div>
          <div v-if="result[section.field].length" class="editable-list">
            <div
              v-for="(_, index) in result[section.field]"
              :key="index"
              class="editable-row"
            >
              <el-input
                v-model="result[section.field][index]"
                :disabled="!editable"
              />
              <el-button
                v-if="editable"
                text
                type="danger"
                :icon="Delete"
                aria-label="删除"
                @click="result[section.field].splice(index, 1)"
              />
            </div>
          </div>
          <el-empty v-else :image-size="48" description="暂无内容" />
        </div>

        <div class="field">
          <div class="field-head">
            <label>生成任务</label>
            <el-button
              v-if="editable"
              text
              type="primary"
              :icon="Plus"
              @click="addTask"
            >
              添加任务
            </el-button>
          </div>
          <div class="task-list">
            <div
              v-for="(task, index) in result.generated_tasks"
              :key="index"
              class="task-row"
            >
              <div class="task-number">{{ index + 1 }}</div>
              <div class="task-fields">
                <el-input
                  v-model="task.title"
                  placeholder="任务标题"
                  :disabled="!editable"
                />
                <el-input
                  v-model="task.description"
                  placeholder="任务描述（可选）"
                  :disabled="!editable"
                />
              </div>
              <el-select
                v-model="task.priority"
                :disabled="!editable"
                class="priority-select"
              >
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
              <el-tag :type="priorityTag(task.priority).type">
                {{ priorityTag(task.priority).text }}
              </el-tag>
              <el-button
                v-if="editable"
                text
                type="danger"
                :icon="Delete"
                aria-label="删除任务"
                @click="result.generated_tasks.splice(index, 1)"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <span class="action-tip">
            {{
              editable
                ? '确认后结果将锁定，并可生成项目任务。'
                : '结果已锁定，可继续创建或打开对应项目。'
            }}
          </span>
          <el-button v-if="editable" :loading="saving" @click="saveChanges()"
            >保存修改</el-button
          >
          <el-button
            v-if="editable"
            type="success"
            plain
            :loading="confirming"
            @click="handleConfirm"
            >确认结果</el-button
          >
          <el-button
            type="primary"
            :loading="creatingProject"
            @click="handleSaveAsProject"
          >
            {{ result.is_confirmed ? '保存为项目' : '确认并保存为项目' }}
          </el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.parse-result {
  max-width: 980px;
  margin: 0 auto;
}
.card {
  padding: 24px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}
.result-head h2 {
  margin: 10px 0 0;
  color: var(--color-text);
  font-size: 21px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-soft);
  font-size: 12px;
}
.edit-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field > label,
.field-head label {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 650;
}
.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.editable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.editable-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
}
.task-number {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  font-size: 12px;
  font-weight: 700;
}
.task-fields {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(220px, 1.2fr);
  gap: 8px;
}
.priority-select {
  width: 92px;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.action-tip {
  margin-right: auto;
  color: var(--color-text-soft);
  font-size: 13px;
}
@media (max-width: 760px) {
  .result-head,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }
  .task-row {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .task-fields {
    flex-basis: calc(100% - 46px);
    grid-template-columns: 1fr;
  }
  .action-tip {
    margin: 0 0 4px;
  }
}
</style>
