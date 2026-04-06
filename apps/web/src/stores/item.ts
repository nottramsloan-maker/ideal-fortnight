import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/** 载体清单里「已完成卡片」的一条（缩略图独立 object URL，避免与下一单拍照 revoke 冲突） */
export type CarrierCommittedItem = {
  id: string
  title: string
  date: string
  imageUrl: string
  /** 完成卡片时的故事正文，供查看页还原 */
  storyText?: string
  /** 完成时首张场景图副本（object URL） */
  sceneImageUrl?: string | null
}

export type CommitListTarget = 'house' | 'feed'

function formatDotDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function newCommittedId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useItemStore = defineStore('item', () => {
  const currentId = ref<string | null>(null)
  const pendingCaptureObjectUrl = ref<string | null>(null)
  /** AI 对话顶栏展示名（稿中 Spirit Drink） */
  const draftItemTitle = ref('Spirit Drink')
  /** 对话内发送的故事文本，供物品卡片展示 */
  const draftStoryText = ref('')
  /** 对话中上传的附图（object URL 列表） */
  const draftGalleryObjectUrls = ref<string[]>([])
  /** AI 对话里用户发送的每条文字（卡片第二屏还原气泡） */
  const draftChatUserLines = ref<string[]>([])
  /** 语音记录（object URL，有则第二屏显示语音条） */
  const draftVoiceObjectUrl = ref<string | null>(null)

  /** 房子清单页：卡片完成后写入 */
  const committedHouseItems = ref<CarrierCommittedItem[]>([])
  /** 非房子载体 feed：卡片完成后写入；初始为空，仅展示已完成项 */
  const committedFeedItems = ref<CarrierCommittedItem[]>([])

  /** 当前拍照链完成后写入哪一份列表（在清单页点加号时设置） */
  const commitListTarget = ref<CommitListTarget>('house')
  /** 卡片页点「完成」后的跳转（用一次即清空）；未设置时默认回房子清单 */
  const afterCardNavigation = ref<RouteLocationRaw | null>(null)

  function setCommitListTarget(t: CommitListTarget) {
    commitListTarget.value = t
  }

  function setAfterCardNavigation(loc: RouteLocationRaw | null) {
    afterCardNavigation.value = loc
  }

  function consumeAfterCardNavigation(): RouteLocationRaw | null {
    const v = afterCardNavigation.value
    afterCardNavigation.value = null
    return v
  }

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

  function setDraftChatUserLines(lines: string[]) {
    draftChatUserLines.value = [...lines]
  }

  function revokeDraftVoice() {
    if (draftVoiceObjectUrl.value) {
      URL.revokeObjectURL(draftVoiceObjectUrl.value)
      draftVoiceObjectUrl.value = null
    }
  }

  function setDraftVoiceFromFile(file: File) {
    revokeDraftVoice()
    draftVoiceObjectUrl.value = URL.createObjectURL(file)
  }

  function clearDraftStoryAndGallery() {
    draftStoryText.value = ''
    draftChatUserLines.value = []
    revokeDraftGallery()
    revokeDraftVoice()
  }

  /**
   * 从卡片页完成时调用：把当前拍照缩略复制为新的 object URL 写入清单，再释放草稿 capture。
   * 仅在有 pending 图时入库；无图则只清空流程（仍应回列表）。
   */
  function findCommittedById(id: string): CarrierCommittedItem | null {
    if (!id) return null
    return (
      committedHouseItems.value.find((r) => r.id === id) ??
      committedFeedItems.value.find((r) => r.id === id) ??
      null
    )
  }

  /** 载体清单已提交卡片：在查看页编辑故事正文后写回 */
  function updateCommittedStoryText(id: string, storyText: string) {
    if (!id) return
    const patch = (list: CarrierCommittedItem[]) => {
      const i = list.findIndex((r) => r.id === id)
      if (i < 0) return false
      const row = list[i]!
      list.splice(i, 1, { ...row, storyText })
      return true
    }
    if (patch(committedHouseItems.value)) return
    patch(committedFeedItems.value)
  }

  async function commitCurrentItemFromCard() {
    const url = pendingCaptureObjectUrl.value
    if (!url) return

    const title = draftItemTitle.value?.trim() || '新物品'
    const date = formatDotDate(new Date())
    const id = newCommittedId()
    const target = commitListTarget.value
    commitListTarget.value = 'house'
    const storyText = draftStoryText.value.trim()

    let sceneImageUrl: string | null = null
    const g0 = draftGalleryObjectUrls.value[0]
    if (g0) {
      try {
        const sb = await fetch(g0).then((r) => r.blob())
        sceneImageUrl = URL.createObjectURL(sb)
      } catch {
        sceneImageUrl = g0
      }
    }

    const pushRow = (imageUrl: string) => {
      const row: CarrierCommittedItem = {
        id,
        title,
        date,
        imageUrl,
        storyText,
        sceneImageUrl,
      }
      if (target === 'feed') committedFeedItems.value.unshift(row)
      else committedHouseItems.value.unshift(row)
    }

    try {
      const blob = await fetch(url).then((r) => r.blob())
      const imageUrl = URL.createObjectURL(blob)
      pushRow(imageUrl)
      revokePendingCapture()
    } catch {
      pushRow(url)
      pendingCaptureObjectUrl.value = null
    }
  }

  return {
    currentId,
    pendingCaptureObjectUrl,
    draftItemTitle,
    draftStoryText,
    draftGalleryObjectUrls,
    draftChatUserLines,
    draftVoiceObjectUrl,
    committedHouseItems,
    committedFeedItems,
    setCommitListTarget,
    setAfterCardNavigation,
    consumeAfterCardNavigation,
    setPendingCapture,
    revokePendingCapture,
    addDraftGalleryFile,
    revokeDraftGallery,
    setDraftStoryText,
    setDraftChatUserLines,
    setDraftVoiceFromFile,
    revokeDraftVoice,
    clearDraftStoryAndGallery,
    commitCurrentItemFromCard,
    findCommittedById,
    updateCommittedStoryText,
  }
})
