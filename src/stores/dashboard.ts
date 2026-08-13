import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getDashboardReminders,
  getDashboardStats,
  mapParseRecordToDashboard,
  type DashboardParseRecord,
  type DashboardReminder,
  type DashboardStats,
} from '@/api/dashboard'
import { getParseResultHistory } from '@/api/parseResult'

export type {
  DashboardParseRecord,
  DashboardReminder,
  DashboardStats,
} from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const loading = ref(false)
  const error = ref('')
  const stats = ref<DashboardStats | null>(null)
  const reminders = ref<DashboardReminder[]>([])
  const parseRecords = ref<DashboardParseRecord[]>([])

  async function loadDashboard() {
    loading.value = true
    error.value = ''
    try {
      const [statsResult, reminderItems, history] = await Promise.all([
        getDashboardStats(),
        getDashboardReminders(),
        getParseResultHistory(5),
      ])
      stats.value = statsResult
      reminders.value = reminderItems
      parseRecords.value = history.items.map(mapParseRecordToDashboard)
    } catch (loadErr) {
      // 失败时保留错误信息并清空旧数据，避免把“加载失败”展示成“真的没有数据”
      error.value =
        loadErr instanceof Error ? loadErr.message : '工作台数据加载失败'
      stats.value = null
      reminders.value = []
      parseRecords.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    stats,
    reminders,
    parseRecords,
    loadDashboard,
  }
})
