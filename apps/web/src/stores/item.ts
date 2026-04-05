import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useItemStore = defineStore('item', () => {
  const currentId = ref<string | null>(null)

  return { currentId }
})
