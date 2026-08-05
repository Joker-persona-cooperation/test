<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore, type UpdateProfileParams } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const nickname = ref('')
const avatarUrl = ref('')
const loggingOut = ref(false)
const editCardEl = ref<HTMLElement | null>(null)

const profile = computed(() => authStore.userInfo)

const avatarSrc = computed(() => profile.value?.avatar_url || '')

// 无头像时展示昵称首字
const avatarFallback = computed(
  () => profile.value?.nickname?.charAt(0) || '用',
)

async function loadProfile() {
  loading.value = true
  try {
    await authStore.fetchProfile()
  } finally {
    loading.value = false
  }
}

async function startEdit() {
  nickname.value = profile.value?.nickname ?? ''
  avatarUrl.value = profile.value?.avatar_url ?? ''
  editing.value = true
  // 编辑表单在右侧内容栏，从左侧身份卡片触发时滚动到表单处
  await nextTick()
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  editCardEl.value?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}

function cancelEdit() {
  editing.value = false
  nickname.value = ''
  avatarUrl.value = ''
}

async function saveProfile() {
  const params: UpdateProfileParams = {}
  if (nickname.value.trim()) params.nickname = nickname.value.trim()
  if (avatarUrl.value.trim()) params.avatar_url = avatarUrl.value.trim()
  if (!params.nickname && !params.avatar_url) {
    ElMessage.warning('请至少填写昵称或头像链接')
    return
  }
  saving.value = true
  try {
    await authStore.updateProfile(params)
    ElMessage.success('个人资料已更新')
    editing.value = false
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  loggingOut.value = true
  try {
    await authStore.logout()
    void router.push({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <div v-loading="loading" class="profile-page">
    <div class="profile-layout">
      <!-- 左栏：身份 + 偏好 -->
      <aside class="profile-side">
        <section class="profile-card profile-card--identity">
          <el-avatar
            :size="88"
            :src="avatarSrc || undefined"
            class="profile-card__avatar"
          >
            {{ avatarFallback }}
          </el-avatar>
          <div class="profile-card__identity">
            <div class="profile-card__name">
              <strong>{{ profile?.nickname || 'TaskPilot 用户' }}</strong>
              <el-tag size="small" type="success" effect="plain">
                已登录
              </el-tag>
            </div>
            <p class="profile-card__email">{{ profile?.email || '—' }}</p>
          </div>

          <dl class="profile-fields">
            <div class="profile-fields__row">
              <dt>用户 ID</dt>
              <dd>{{ profile?.id ?? '—' }}</dd>
            </div>
          </dl>

          <el-button
            type="primary"
            plain
            :icon="Edit"
            class="profile-card__edit"
            @click="startEdit"
          >
            编辑资料
          </el-button>
        </section>

        <section class="profile-card">
          <h2 class="profile-card__title">
            <el-icon><Setting /></el-icon>
            偏好设置
          </h2>
          <p class="profile-card__desc">
            通知提醒、默认优先级与界面偏好等个性化设置正在规划中，后续版本接入。
          </p>
        </section>
      </aside>

      <!-- 右栏：编辑资料 + 账号安全 -->
      <div class="profile-content">
        <section
          ref="editCardEl"
          class="profile-card"
          :class="{ 'is-editing': editing }"
        >
          <h2 class="profile-card__title">
            <el-icon><Edit /></el-icon>
            编辑资料
          </h2>

          <template v-if="editing">
            <el-form label-position="top">
              <el-form-item label="昵称">
                <el-input
                  v-model="nickname"
                  placeholder="输入新的昵称"
                  maxlength="64"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="头像链接">
                <el-input
                  v-model="avatarUrl"
                  placeholder="输入图片 URL（可选）"
                />
              </el-form-item>
            </el-form>
            <div class="profile-actions">
              <el-button :disabled="saving" @click="cancelEdit">取消</el-button>
              <el-button type="primary" :loading="saving" @click="saveProfile">
                保存修改
              </el-button>
            </div>
          </template>

          <template v-else>
            <p class="profile-card__desc">修改昵称与头像，更新后立即生效。</p>
            <div class="profile-actions">
              <el-button type="primary" :icon="Edit" @click="startEdit">
                修改昵称 / 头像
              </el-button>
            </div>
          </template>
        </section>

        <section class="profile-card">
          <h2 class="profile-card__title">账号操作</h2>
          <p class="profile-card__desc">退出当前账号后，将返回登录页面。</p>
          <div class="profile-actions">
            <el-button
              type="danger"
              plain
              :icon="SwitchButton"
              :loading="loggingOut"
              @click="handleLogout"
            >
              退出登录
            </el-button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 1080px;
  margin: 0 auto;
  min-height: 60vh;

  .profile-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .profile-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: sticky;
    top: 16px;
  }

  .profile-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .profile-card {
    padding: 22px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);

    &--identity {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    &__avatar {
      flex-shrink: 0;
      font-size: 32px;
      font-weight: 600;
      background: var(--color-primary-soft);
      color: var(--color-primary-deep);
    }

    &__identity {
      margin-top: 14px;
    }

    &__name {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      strong {
        font-size: 19px;
        color: var(--color-text);
      }
    }

    &__email {
      margin: 8px 0 0;
      font-size: 13px;
      color: var(--color-text-soft);
      overflow-wrap: anywhere;
    }

    &__edit {
      width: 100%;
      margin-top: 18px;
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 18px;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text);
    }

    &__desc {
      margin: 0 0 16px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--color-text-soft);
    }

    &.is-editing {
      border-color: var(--color-primary);
    }
  }

  .profile-fields {
    width: 100%;
    margin: 18px 0 0;
    border-top: 1px solid var(--color-border);
    padding-top: 4px;

    &__row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 9px 0;
      font-size: 14px;

      dt {
        color: var(--color-text-soft);
      }

      dd {
        margin: 0;
        color: var(--color-text);
      }
    }
  }

  .profile-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }

  @media (max-width: 900px) {
    .profile-layout {
      grid-template-columns: 1fr;
    }

    .profile-side {
      position: static;
    }
  }
}
</style>
