<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, FolderOpened } from '@element-plus/icons-vue'
import { getProjects, type Project } from '@/api/project'

const router = useRouter()
const projects = ref<Project[]>([])
const status = ref<'active' | 'archived'>('active')
const loading = ref(false)
const errorMsg = ref('')

function formatDate(value: string | null) {
  if (!value) return '未设置截止时间'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
}

async function loadProjects() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await getProjects(status.value)
    projects.value = data.items
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '项目加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadProjects)
</script>

<template>
  <div class="projects-page">
    <div class="toolbar">
      <el-segmented
        v-model="status"
        :options="[
          { label: '进行中', value: 'active' },
          { label: '已归档', value: 'archived' },
        ]"
        @change="loadProjects"
      />
      <el-button type="primary" @click="router.push({ name: 'parse-create' })"
        >新建解析</el-button
      >
    </div>

    <div v-loading="loading" class="project-surface">
      <el-result
        v-if="errorMsg"
        icon="error"
        title="项目加载失败"
        :sub-title="errorMsg"
      >
        <template #extra
          ><el-button type="primary" @click="loadProjects"
            >重新加载</el-button
          ></template
        >
      </el-result>

      <el-empty
        v-else-if="!loading && projects.length === 0"
        :description="
          status === 'active' ? '暂无进行中的项目' : '暂无已归档项目'
        "
      >
        <el-button
          v-if="status === 'active'"
          type="primary"
          @click="router.push({ name: 'parse-create' })"
        >
          从文档创建项目
        </el-button>
      </el-empty>

      <div v-else class="project-grid">
        <button
          v-for="project in projects"
          :key="project.id"
          type="button"
          class="project-card"
          @click="
            router.push({
              name: 'project-detail',
              params: { projectId: project.id },
            })
          "
        >
          <span class="project-icon"
            ><el-icon><FolderOpened /></el-icon
          ></span>
          <span class="project-main">
            <strong>{{ project.name }}</strong>
            <span>{{ project.description || '由解析结果生成的任务项目' }}</span>
          </span>
          <span class="project-deadline">
            <el-icon><Calendar /></el-icon>{{ formatDate(project.deadline) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.projects-page {
  max-width: 1100px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.project-surface {
  min-height: 260px;
  padding: 22px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 14px;
}
.project-card {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s,
    box-shadow 0.18s,
    transform 0.18s;
}
.project-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
.project-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  font-size: 20px;
}
.project-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.project-main strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-main span {
  overflow: hidden;
  color: var(--color-text-soft);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-deadline {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-soft);
  font-size: 12px;
}
</style>
