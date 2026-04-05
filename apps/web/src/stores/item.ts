import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useItemStore = defineStore('item', () => {
  const currentId = ref<string | null>(null)
  const pendingCaptureObjectUrl = ref<string | null>(null)
  /** AI 对话顶栏展示名（稿中 Spirit Drink） */
  const draftItemTitle = ref('Spirit Drink')
  /** 对话内发送的故事文本，供物品卡片展示 */
  const draftStoryText = ref('')
  /** 对话中上传的附图（object URL 列表） */
  const draftGalleryObjectUrls = ref<string[]>([])

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

  function revokeDraftGallery() {
    for (const u of draftGalleryObjectUrls.value) {
      URL.revokeObjectURL(u)
    }
    draftGalleryObjectUrls.value = []
  }

  function addDraftGalleryFile(file: File) {
    draftGalleryObjectUrls.value.push(URL.createObjectURL(file))
  }

  function setDraftStoryText(text: string) {
    draftStoryText.value = text
  }

  function clearDraftStoryAndGallery() {
    draftStoryText.value = ''
    revokeDraftGallery()
  }

  return {
    currentId,
    pendingCaptureObjectUrl,
    draftItemTitle,
    draftStoryText,
    draftGalleryObjectUrls,
    setPendingCapture,
    revokePendingCapture,
    addDraftGalleryFile,
    revokeDraftGallery,
    setDraftStoryText,
    clearDraftStoryAndGallery,
  }
})
