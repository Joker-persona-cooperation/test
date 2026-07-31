<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Connection, Position } from '@element-plus/icons-vue'
import AppPanel from '@/components/common/AppPanel.vue'

const route = useRoute()
const router = useRouter()

// 标题与描述已由顶栏承担，这里只呈现「还差什么」这一层信息
const suggestedActions = computed(() => route.meta.suggestedActions ?? [])
const endpointGroups = computed(() => route.meta.endpointGroups ?? [])
</script>

<template>
  <div class="module-placeholder">
    <div class="module-placeholder__notice">
      <p>该模块页面骨架已预留，业务能力正在接入中。</p>
      <el-button
        text
        type="primary"
        @click="router.push({ name: 'dashboard' })"
      >
        返回工作台
      </el-button>
    </div>

    <div class="module-placeholder__grid">
      <AppPanel title="本页目标" :icon="Position">
        <ol v-if="suggestedActions.length" class="module-placeholder__list">
          <li v-for="item in suggestedActions" :key="item">{{ item }}</li>
        </ol>
        <p v-else class="module-placeholder__empty">尚未拆解具体目标。</p>
      </AppPanel>

      <AppPanel title="待接入接口" :icon="Connection">
        <ul v-if="endpointGroups.length" class="module-placeholder__endpoints">
          <li v-for="item in endpointGroups" :key="item">
            <code>{{ item }}</code>
          </li>
        </ul>
        <p v-else class="module-placeholder__empty">无需额外接口。</p>
      </AppPanel>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.module-placeholder {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-primary-soft);

    p {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-soft);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  &__list {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.9;
    color: var(--color-text-soft);
  }

  &__endpoints {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;

    code {
      display: block;
      padding: 7px 10px;
      border-radius: 8px;
      background: var(--color-bg);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      color: var(--color-text);
      overflow-x: auto;
    }
  }

  &__empty {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-soft);
  }
}

@media (max-width: 900px) {
  .module-placeholder {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__notice {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
