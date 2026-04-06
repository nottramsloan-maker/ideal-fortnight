import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCarrierStore = defineStore('carrier', () => {
  const list = ref<unknown[]>([])
  /** 初始化流程中选中的载体模板 type_key（PRD 4.2.1） */
  const onboardingTemplateKey = ref<string | null>(null)

  /**
   * 「兴趣清单」网格里除房子外的载体顺序；默认冰箱+书架与稿一致。
   * 从加号进入 onboarding 选中非房间载体后会追加（去重）。
   */
  const directoryCarrierKeys = ref<string[]>(['fridge', 'bookshelf'])

  function addDirectoryCarrierIfNew(key: string) {
    if (!key || key === 'room') return
    if (directoryCarrierKeys.value.includes(key)) return
    directoryCarrierKeys.value = [...directoryCarrierKeys.value, key]
  }

  return { list, onboardingTemplateKey, directoryCarrierKeys, addDirectoryCarrierIfNew }
})
