import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCarrierStore = defineStore('carrier', () => {
  const list = ref<unknown[]>([])
  /** 初始化流程中选中的载体模板 type_key（PRD 4.2.1） */
  const onboardingTemplateKey = ref<string | null>(null)

  return { list, onboardingTemplateKey }
})
