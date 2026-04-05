import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const avatarPresetId = ref<string | null>(null)
  const nickname = ref<string>('')

  return { avatarPresetId, nickname }
})
