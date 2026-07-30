<script setup lang="ts">
import { Collection, Position, Setting } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const title = computed(() => (route.meta.title as string) || '模块建设中')
const description = computed(
  () =>
    (route.meta.description as string) ||
    '该模块的页面骨架已预留，接下来将继续接入对应业务接口。',
)
const statusLabel = computed(
  () => (route.meta.statusLabel as string) || '开发进行中',
)
const suggestedActions = computed(
  () => (route.meta.suggestedActions as string[]) || [],
)
const endpointGroups = computed(
  () => (route.meta.endpointGroups as string[]) || [],
)
</script>

<template>
  <div class="workspace-placeholder">
    <section class="workspace-placeholder__hero">
      <div>
        <el-tag type="warning" effect="plain">{{ statusLabel }}</el-tag>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <div class="workspace-placeholder__actions">
          <el-button type="primary" round @click="router.push('/dashboard')">
            返回总览
          </el-button>
          <el-button round @click="router.push('/parse/new')">
            前往新建解析
          </el-button>
        </div>
      </div>
      <div class="workspace-placeholder__badge">
        <el-icon :size="44"><Setting /></el-icon>
      </div>
    </section>

    <section class="workspace-placeholder__grid">
      <article class="placeholder-card">
        <div class="placeholder-card__title">
          <el-icon><Position /></el-icon>
          <span>本页目标</span>
        </div>
        <ul>
          <li v-for="item in suggestedActions" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="placeholder-card">
        <div class="placeholder-card__title">
          <el-icon><Collection /></el-icon>
          <span>待接入接口</span>
        </div>
        <ul>
          <li v-for="item in endpointGroups" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.workspace-placeholder {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__hero {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 28px 32px;
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);

    h2 {
      margin: 14px 0 10px;
      font-size: 28px;
      color: var(--color-text);
    }

    p {
      margin: 0;
      max-width: 720px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--color-text-soft);
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  &__badge {
    width: 108px;
    height: 108px;
    flex-shrink: 0;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eef7ff 0%, #d9ecff 100%);
    color: var(--color-primary-deep);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
}

.placeholder-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 22px 24px;

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
  }

  ul {
    margin: 0;
    padding-left: 18px;
    line-height: 1.9;
    color: var(--color-text-soft);
  }
}

@media (max-width: 900px) {
  .workspace-placeholder {
    &__hero {
      flex-direction: column;
    }

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .workspace-placeholder {
    &__actions {
      flex-direction: column;
    }
  }
}
</style>
