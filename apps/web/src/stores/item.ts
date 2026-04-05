import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useItemStore = defineStore('item', () => {
  const currentId = ref<string | null>(null)
  const pendingCaptureObjectUrl = ref<string | null>(null)
  /** AI 对话顶栏展示名（稿中 Spirit Drink） */
  const draftItemTitle = ref('Spirit Drink')

  function setPendingCapture(blob: Blob) {
    revokePendingCapture()
    pendingCaptureObjectUrl.value = URL.createObjectURL(blob)
  }

  function revokePendingCapture() {
    if (pendingCaptureObjectUrl.value) {
      URL.revokeObjectURL(pendingCaptureObjectUrl.value)
      pendingCaptureObjectUrl.value = null
    }
  }

  return {
    currentId,
    pendingCaptureObjectUrl,
    draftItemTitle,
    setPendingCapture,
    revokePendingCapture,
  }
})
