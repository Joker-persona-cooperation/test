<script setup lang="ts">
// 第一步 + 第二步：文本录入页
// 1) 录入文本 -> POST /documents/text 创建文档
// 2) 拿到 documentId -> POST /parse-jobs 创建解析任务
// 3) 拿到 jobId -> 跳转处理中页 /parse/:jobId/processing
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useParseStore } from '@/stores/parse'

const router = useRouter()
const parseStore = useParseStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const contentLength = computed(() => form.content.length)

const form = reactive({
  title: '',
  content: '',
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' },
    { max: 80, message: '标题不能超过 80 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入需要解析的文档内容', trigger: 'blur' },
    {
      min: 20,
      message: '内容过短，建议至少 20 个字符以便解析',
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const job = await parseStore.createFromText(form.title.trim(), form.content)
    ElMessage.success('已提交解析，正在处理中')
    router.replace(`/parse/${job.id}/processing`)
  } catch {
    // 请求层已统一提示错误，这里只负责结束流程
  } finally {
    submitting.value = false
  }
}

function fillExample() {
  form.title = '移动端活动页上线项目'
  form.content = `本项目需在 8 月 20 日前完成移动端活动页开发与上线。
目标：实现一个面向新用户的活动落地页，提升注册转化率。
交付物：1. 活动页 H5；2. 后台数据统计看板；3. 上线验收报告。
要求：
1. 兼容 iOS/Android 主流浏览器；
2. 首屏加载不超过 2 秒；
3. 支持埋点上报注册、点击、分享事件；
4. 设计稿走查通过后才能提测。
风险：活动开始前 3 天不可再改版，需预留回归测试时间。
任务：
1. 需求评审与设计走查；
2. 前端 H5 页面开发；
3. 后台统计接口联调；
4. 埋点接入与自测；
5. 提测与上线回归。`
}
</script>

<template>
  <div class="parse-new">
    <div class="parse-new__card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="给本次解析起个名字"
            maxlength="80"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="文档内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :autosize="{ minRows: 12, maxRows: 20 }"
            placeholder="在此粘贴需求文档、会议纪要、任务说明等文本内容..."
            resize="vertical"
          />
          <div class="parse-new__content-meta">
            <span>{{ contentLength }} 字</span>
            <el-button link type="primary" @click="fillExample">
              填充示例
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <div class="parse-new__actions">
            <el-button size="large" @click="router.push('/dashboard')">
              取消
            </el-button>
            <el-button
              class="parse-new__submit"
              type="primary"
              size="large"
              native-type="submit"
              :loading="submitting"
              :disabled="!form.content"
            >
              {{ submitting ? '提交中...' : '提交解析' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="parse-new__tip">
        <span class="parse-new__tip-badge">提示</span>
        PDF 文件上传能力将在后续版本支持，当前请使用文本粘贴方式。
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.parse-new {
  max-width: 820px;
  margin: 0 auto;

  &__card {
    padding: 32px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  &__content-meta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    color: var(--color-text-soft);
    font-size: 12px;
  }

  &__actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  &__submit {
    min-width: 140px;
    font-size: 15px;
  }

  &__tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    padding: 12px 14px;
    border-radius: var(--radius-control);
    background: var(--color-bg);
    color: var(--color-text-soft);
    font-size: 13px;
  }

  &__tip-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-primary-soft);
    color: var(--color-primary-deep);
    font-size: 12px;
    font-weight: 600;
  }

  @media (max-width: 600px) {
    &__card {
      padding: 20px;
    }

    &__actions {
      align-items: stretch;
      flex-direction: column-reverse;

      :deep(.el-button) {
        width: 100%;
        margin: 0;
      }
    }
  }
}
</style>
