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
  const stats = ref<DashboardStats | null>(null)
  const reminders = ref<DashboardReminder[]>([])
  const parseRecords = ref<DashboardParseRecord[]>([])

  async function loadDashboard() {
    loading.value = true
    try {
      const [statsResult, reminderItems, history] = await Promise.all([
        getDashboardStats(),
        getDashboardReminders(),
        getParseResultHistory(5),
      ])
      stats.value = statsResult
      reminders.value = reminderItems
      parseRecords.value = history.items.map(mapParseRecordToDashboard)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    stats,
    reminders,
    parseRecords,
    loadDashboard,
  }
})
