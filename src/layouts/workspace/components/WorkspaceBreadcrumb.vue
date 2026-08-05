<script setup lang="ts">
// 布局私有面包屑：数据源是路由 meta.breadcrumb（类型见 src/types/router.d.ts）。
// 最后一项为当前页（不可点击），前面的项按 name 跳转，始终位于固定顶栏，
// 因此用户滚动到页面任意位置都能通过面包屑返回上级页面。
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface BreadcrumbItem {
  label: string
  name?: string
}

const route = useRoute()
const router = useRouter()

const items = computed<BreadcrumbItem[]>(() => route.meta.breadcrumb ?? [])

function handleClick(item: BreadcrumbItem, index: number) {
  if (index === items.value.length - 1) return
  if (item.name && item.name !== route.name) {
    void router.push({ name: item.name })
  }
}
</script>

<template>
  <nav
    v-if="items.length"
    class="workspace-breadcrumb"
    aria-label="面包屑导航"
  >
    <template v-for="(item, index) in items" :key="index">
      <button
        v-if="index < items.length - 1"
        type="button"
        class="workspace-breadcrumb__item workspace-breadcrumb__item--link"
        @click="handleClick(item, index)"
      >
        {{ item.label }}
      </button>
      <span
        v-else
        class="workspace-breadcrumb__item workspace-breadcrumb__item--current"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        {{ item.label }}
      </span>
      <span
        v-if="index < items.length - 1"
        class="workspace-breadcrumb__sep"
        aria-hidden="true"
        >/</span
      >
    </template>
  </nav>
</template>

<style lang="scss" scoped>
.workspace-breadcrumb {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--color-text-soft);
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;

  &__item {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;

    &--link {
      flex-shrink: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--color-text-soft);
      font: inherit;
      cursor: pointer;
      transition: color 0.18s ease;

      &:hover {
        color: var(--color-primary-deep);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }
    }

    &--current {
      flex-shrink: 1;
      color: var(--color-text);
      font-weight: 600;
    }
  }

  &__sep {
    flex-shrink: 0;
    color: var(--color-text-soft);
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-breadcrumb__item--link {
    transition: none;
  }
}
</style>
