<script setup lang="ts">
// 解析详情（解析结果）页：对齐 goals/parse-detail.html 的「左原文预览 + 右编辑表单」布局。
// 数据全部来自真实接口：
//   - 解析结果：GET /parse-jobs/:jobId/result
//   - 原文预览：GET /documents/:documentId（取 content 字段）
//   - 保存修改：PUT /parse-results/:id（乐观锁 version）
//   - 确认结果：POST /parse-results/:id/confirm
//   - 保存为项目：POST /projects
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Box,
  Calendar,
  Check,
  Checked,
  Delete,
  Document,
  EditPen,
  FolderAdd,
  List,
  Plus,
  WarnTriangleFilled,
} from '@element-plus/icons-vue'
import { useParseStore, type UpdateParseResultParams } from '@/stores/parse'
import { useProjectStore, type Project } from '@/stores/project'

const route = useRoute()
const router = useRouter()
const jobId = Number(route.params.jobId)
const parseStore = useParseStore()
const projectStore = useProjectStore()
const { currentResult: result, sourceDocument } = storeToRefs(parseStore)

const loading = ref(true)
const saving = ref(false)
const creatingProject = ref(false)
const errorMsg = ref('')
const existingProject = ref<Project | null>(null)

// ---- 原文预览 ----
const originalText = computed(() => sourceDocument.value?.content || '')

const editable = computed(() =>
  Boolean(result.value && !result.value.is_confirmed),
)

const primaryActionLabel = computed(() => {
  if (existingProject.value) return '查看项目'
  return result.value?.is_confirmed ? '创建项目' : '确认并创建项目'
})

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
    const loadedResult = await parseStore.loadResult(jobId)
    existingProject.value = await projectStore
      .findProjectByParseResultId(loadedResult.id)
      .catch(() => null)
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
    await parseStore.saveResult(params)
    if (showSuccess) ElMessage.success('解析结果已保存')
    return result.value
  } catch {
    return null
  } finally {
    saving.value = false
  }
}

async function handleSaveAsProject() {
  if (!result.value) return
  if (existingProject.value) {
    await router.push({
      name: 'project-detail',
      params: { projectId: existingProject.value.id },
      query:
        existingProject.value.status === 'deleted'
          ? { mode: 'history', status: 'deleted' }
          : undefined,
    })
    return
  }
  try {
    await ElMessageBox.confirm(
      '确认将此解析结果保存为新项目？系统将根据任务建议清单自动生成项目任务。',
      '保存为项目',
      {
        confirmButtonText: '确认保存',
        cancelButtonText: '取消',
        type: 'info',
      },
    )
  } catch {
    return
  }

  creatingProject.value = true
  try {
    if (!result.value.is_confirmed) {
      const saved = await saveChanges(false)
      if (!saved) return
      await parseStore.confirmResult()
    }

    const created = await projectStore.createFromResult(result.value)
    existingProject.value = created.project
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
        <el-button @click="router.push({ name: 'parse-records' })"
          >返回解析记录</el-button
        >
        <el-button type="primary" @click="loadResult">重新加载</el-button>
      </template>
    </el-result>

    <template v-else-if="result">
      <el-button
        text
        :icon="ArrowLeft"
        class="back-link"
        @click="router.push({ name: 'parse-records' })"
      >
        解析记录 / 解析结果
      </el-button>
      <!-- 顶部信息条 -->
      <div class="detail-toolbar">
        <div class="detail-meta">
          <el-tag type="success" effect="plain" size="small">解析完成</el-tag>
          <span v-if="result.ai_model">AI 模型：{{ result.ai_model }}</span>
          <span>版本 v{{ result.version }}</span>
        </div>
        <el-tag
          :type="result.is_confirmed ? 'success' : 'warning'"
          effect="plain"
          size="small"
        >
          {{ result.is_confirmed ? '已确认' : '未确认' }}
        </el-tag>
      </div>

      <!-- 左右分栏：左原文预览 / 右编辑表单 -->
      <div class="split-layout">
        <!-- 原文预览 -->
        <aside class="split-left">
          <div class="card preview-card">
            <div class="section-title">
              <el-icon><Document /></el-icon> 原文预览
            </div>
            <div class="original-text">
              {{ originalText || '暂无可预览的原文内容。' }}
            </div>
          </div>
        </aside>

        <!-- 编辑表单 -->
        <section class="split-right">
          <div class="card edit-card">
            <div class="edit-section">
              <div class="edit-section-header">
                <el-icon><EditPen /></el-icon> 文档标题
              </div>
              <el-input
                v-model="result.title"
                size="large"
                maxlength="255"
                :disabled="!editable"
              />
            </div>

            <div class="edit-section">
              <div class="edit-section-header">
                <el-icon><Document /></el-icon> 文档摘要
              </div>
              <el-input
                v-model="result.summary"
                type="textarea"
                :rows="3"
                maxlength="5000"
                :disabled="!editable"
              />
            </div>

            <div class="edit-section">
              <div class="edit-section-header">
                <el-icon><Calendar /></el-icon> 截止时间
              </div>
              <el-date-picker
                v-model="result.deadline"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                placeholder="未指定截止时间"
                :disabled="!editable"
                style="width: 100%"
              />
            </div>

            <!-- 交付物列表 -->
            <div class="edit-section">
              <div class="flex-between">
                <div class="edit-section-header">
                  <el-icon><Box /></el-icon> 交付物列表
                </div>
                <el-button
                  v-if="editable"
                  text
                  type="primary"
                  :icon="Plus"
                  @click="addListItem('deliverables')"
                  >添加</el-button
                >
              </div>
              <div
                v-for="(_, index) in result.deliverables"
                :key="index"
                class="list-item-edit"
              >
                <el-input
                  v-model="result.deliverables[index]"
                  placeholder="输入交付物名称"
                  :disabled="!editable"
                />
                <el-button
                  v-if="editable"
                  text
                  type="danger"
                  :icon="Delete"
                  aria-label="删除交付物"
                  @click="result.deliverables.splice(index, 1)"
                />
              </div>
              <el-empty
                v-if="!result.deliverables.length"
                :image-size="48"
                description="暂无交付物"
              />
            </div>

            <!-- 关键要求 -->
            <div class="edit-section">
              <div class="flex-between">
                <div class="edit-section-header">
                  <el-icon><Checked /></el-icon> 关键要求
                </div>
                <el-button
                  v-if="editable"
                  text
                  type="primary"
                  :icon="Plus"
                  @click="addListItem('key_requirements')"
                  >添加</el-button
                >
              </div>
              <div
                v-for="(_, index) in result.key_requirements"
                :key="index"
                class="list-item-edit"
              >
                <el-input
                  v-model="result.key_requirements[index]"
                  placeholder="输入关键要求"
                  :disabled="!editable"
                />
                <el-button
                  v-if="editable"
                  text
                  type="danger"
                  :icon="Delete"
                  aria-label="删除关键要求"
                  @click="result.key_requirements.splice(index, 1)"
                />
              </div>
              <el-empty
                v-if="!result.key_requirements.length"
                :image-size="48"
                description="暂无关键要求"
              />
            </div>

            <!-- 风险提醒 -->
            <div class="edit-section">
              <div class="flex-between">
                <div class="edit-section-header">
                  <el-icon><WarnTriangleFilled /></el-icon> 风险提醒
                </div>
                <el-button
                  v-if="editable"
                  text
                  type="primary"
                  :icon="Plus"
                  @click="addListItem('risk_warnings')"
                  >添加</el-button
                >
              </div>
              <div
                v-for="(_, index) in result.risk_warnings"
                :key="index"
                class="list-item-edit"
              >
                <el-input
                  v-model="result.risk_warnings[index]"
                  placeholder="输入风险提醒"
                  :disabled="!editable"
                />
                <el-button
                  v-if="editable"
                  text
                  type="danger"
                  :icon="Delete"
                  aria-label="删除风险提醒"
                  @click="result.risk_warnings.splice(index, 1)"
                />
              </div>
              <el-empty
                v-if="!result.risk_warnings.length"
                :image-size="48"
                description="暂无风险提醒"
              />
            </div>

            <!-- AI 任务建议清单 -->
            <div class="edit-section">
              <div class="flex-between">
                <div class="edit-section-header">
                  <el-icon><List /></el-icon> AI 任务建议清单
                </div>
                <el-button
                  v-if="editable"
                  text
                  type="primary"
                  :icon="Plus"
                  @click="addTask"
                  >添加任务</el-button
                >
              </div>
              <div
                v-for="(task, index) in result.generated_tasks"
                :key="index"
                class="task-item-edit"
              >
                <el-input
                  v-model="task.title"
                  placeholder="任务标题"
                  :disabled="!editable"
                />
                <el-select
                  v-model="task.priority"
                  style="width: 110px"
                  :disabled="!editable"
                >
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
                <el-button
                  v-if="editable"
                  text
                  type="danger"
                  :icon="Delete"
                  aria-label="删除任务"
                  @click="result.generated_tasks.splice(index, 1)"
                />
              </div>
              <el-empty
                v-if="!result.generated_tasks.length"
                :image-size="48"
                description="暂无任务建议"
              />
              <el-alert type="info" :closable="false" class="snapshot-alert">
                此处编辑的是解析结果快照。保存为项目后，任务将展开为独立项目任务，后续在项目页编辑不再回写此处。
              </el-alert>
            </div>

            <!-- 底部操作条 -->
            <div class="detail-actions">
              <el-button
                v-if="editable"
                :loading="saving"
                :icon="Check"
                @click="saveChanges()"
                >保存修改</el-button
              >
              <div class="spacer" />
              <el-button
                type="primary"
                :icon="FolderAdd"
                :loading="creatingProject"
                @click="handleSaveAsProject"
                >{{ primaryActionLabel }}</el-button
              >
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.parse-result {
  max-width: 1200px;
  margin: 0 auto;

  .back-link {
    margin: -6px 0 12px;
  }

  .card {
    padding: 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  /* 顶部信息条 */
  .detail-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .detail-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--color-text-soft);
    font-size: 13px;
  }

  /* 左右分栏 */
  .split-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .split-left {
    width: 38%;
    flex-shrink: 0;
    position: sticky;
    top: 88px;
  }

  .split-right {
    flex: 1;
    min-width: 0;
  }

  /* 原文预览 */
  .preview-card {
    padding: 20px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--color-text);
  }

  .original-text {
    background: var(--color-bg);
    border-radius: 8px;
    padding: 20px;
    max-height: 600px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.8;
    color: var(--color-text);
    white-space: pre-wrap;
  }

  /* 编辑区 */
  .edit-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
  }

  .edit-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .edit-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .list-item-edit {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-input) {
      flex: 1;
    }
  }

  .task-item-edit {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-bg);
    border-radius: 8px;

    :deep(.el-input) {
      flex: 1;
    }
  }

  .snapshot-alert {
    margin-top: 8px;
  }

  /* 底部操作条 */
  .detail-actions {
    position: sticky;
    bottom: 12px;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .spacer {
    flex: 1;
  }

  /* 响应式：窄屏降为单列，sticky 失效 */
  @media (max-width: 900px) {
    padding-bottom: 76px;

    .split-layout {
      flex-direction: column;
    }

    .split-left {
      width: 100%;
      position: static;
    }

    .detail-toolbar {
      flex-wrap: wrap;
      gap: 8px;
    }

    .detail-actions {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 20;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--color-border);
    }

    .detail-actions .spacer {
      display: none;
    }

    .detail-actions :deep(.el-button) {
      flex: 1;
      margin: 0;
    }
  }

  @media (max-width: 560px) {
    .card,
    .edit-card {
      padding: 16px;
    }

    .detail-meta {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }

    .task-item-edit {
      align-items: stretch;
      flex-wrap: wrap;
    }

    .task-item-edit :deep(.el-select) {
      flex: 1;
    }
  }
}
</style>
