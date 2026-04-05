import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAiChatStore = defineStore('aiChat', () => {
  const messages = ref<{ role: string; content: string }[]>([])

  return { messages }
})
