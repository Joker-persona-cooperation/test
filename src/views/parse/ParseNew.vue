<script setup lang="ts">
// 第一步 + 第二步：文本录入页
// 1) 录入文本 -> POST /documents/text 创建文档
// 2) 拿到 documentId -> POST /parse-jobs 创建解析任务
// 3) 拿到 jobId -> 跳转处理中页 /parse/:jobId/processing
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Document as DocIcon } from '@element-plus/icons-vue'
import { createTextDocument } from '@/api/document'
import { createParseJob } from '@/api/parseJob'

const router = useRouter()

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
    // 第一步：录入文本文档
    const doc = await createTextDocument({
      title: form.title.trim(),
      text: form.content,
    })
    // 第二步：基于文档创建解析任务
    const job = await createParseJob({ document_id: doc.id })
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
      <div class="parse-new__head">
        <div class="head-icon">
          <el-icon><DocIcon /></el-icon>
        </div>
        <div class="head-text">
          <h2>新建解析</h2>
          <p>
            粘贴任务文档或需求描述，AI
            将自动拆解为目标、交付物、要求、风险与任务清单。
          </p>
        </div>
      </div>

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
          <div class="content-meta">
            <span>{{ contentLength }} 字</span>
            <el-button link type="primary" @click="fillExample">
              填充示例
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            class="parse-submit"
            type="primary"
            native-type="submit"
            :loading="submitting"
            :disabled="!form.content"
          >
            {{ submitting ? '提交中...' : '提交解析' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="parse-new__tip">
        <span class="tip-badge">提示</span>
        PDF 文件上传能力将在后续版本支持，当前请使用文本粘贴方式。
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.parse-new {
  max-width: 820px;

  &__card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 32px;
  }

  &__head {
    display: flex;
    gap: 16px;
    margin-bottom: 28px;

    .head-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 12px;
      background: var(--color-primary-soft);
      color: var(--color-primary-deep);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .head-text {
      h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--color-text-soft);
        line-height: 1.6;
      }
    }
  }
}

.content-meta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-soft);
}

.parse-submit {
  width: 100%;
  height: 46px;
  font-size: 15px;
}

.parse-new__tip {
  margin-top: 20px;
  padding: 12px 14px;
  background: var(--color-bg);
  border-radius: var(--radius-control);
  font-size: 13px;
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
  gap: 8px;

  .tip-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-primary-soft);
    color: var(--color-primary-deep);
    font-size: 12px;
    font-weight: 600;
  }
}
</style>
