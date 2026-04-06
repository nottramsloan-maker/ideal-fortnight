<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'

import imgCardStageBg from '@/assets/item-card-gen/card-stage-bg.png'
import imgDoneBtn from '@/assets/item-card-gen/btn-done.png'
import imgPaper from '@/assets/item-card-gen/paper-slip.png'
import imgStar from '@card-assets/Group 4.png'
import imgVoice from '@card-assets/Group 5.png'
import imgThumbsUp from '@card-assets/thumbs-up.png'
import imgThumbsUpLiked from '@card-assets/thumbs-up-liked.png'
import imgRepeat from '@card-assets/repeat.png'
import imgCreate from '@card-assets/create.png'
import imgChevron from '@card-assets/chevron-down.png'

const PANEL_H = 844

const SOCIAL_FRIEND_COUNT = 63

const DEFAULT_STORY_LINES = [
  '我要在灯塔上 栽上甜美爱丽斯',
  '沿着边儿摇晃洗脸盆',
  '船只溃散船只沉没',
  '只剩下我乘飓风',
  '海浪掀起浪峰弯下',
  '船只跃上浪峰',
  '漂到海岛鹦鹉喋喋',
  '伯纳德丢下小刀子',
  '跟在她的后面走',
  '招来晃去海草湿干',
  '我憎恶悬荡潮湿',
  '作业本一本一本上',
  '电线海草摇晃',
]

/** 中间按钮：从中随机一首替换当前诗句（与默认首篇不同条目） */
const POEM_VARIANTS = [
  DEFAULT_STORY_LINES.join('\n'),
  '一颗骰子在口袋里沉默\n它记得每一次被掷起的温度\n点数像是命运写下的逗号\n我们停在句读之间，互相看一眼',
  '雨线把窗玻璃擦成毛玻璃\n世界只剩下轮廓和声响\n你递来的温度刚好\n让这一块模糊变得可以靠岸',
  '把台灯拧暗一格\n影子里的事物更诚实\n故事不必说完\n留一行空白给明天',
  '风从巷口拐进来\n带着远处烧烤摊的烟\n我把这一天折成小块\n塞进衣兜，和你一起走回家',
  '窗台上的绿植又长高半寸\n阳光在叶脉里慢慢爬\n你说今天没什么大事发生\n我却觉得这样就很好',
]

const router = useRouter()
const route = useRoute()
const itemStore = useItemStore()
const {
  pendingCaptureObjectUrl,
  draftItemTitle,
  draftStoryText,
  draftGalleryObjectUrls,
  draftChatUserLines,
  draftVoiceObjectUrl,
} = storeToRefs(itemStore)

const AI_CARD_PROMPT = '聊聊你和它有什么故事么？'

const isCardViewMode = computed(() => route.name === 'item-card-view')
const committedIdParam = computed(() => {
  const id = route.params.committedId
  return typeof id === 'string' ? id : ''
})
const committedRow = computed(() =>
  isCardViewMode.value && committedIdParam.value
    ? itemStore.findCommittedById(committedIdParam.value)
    : null,
)

watch(
  () => ({
    name: route.name,
    cid:
      typeof route.params.committedId === 'string' ? route.params.committedId : '',
  }),
  ({ name, cid }) => {
    if (name !== 'item-card-view') return
    if (!cid || !itemStore.findCommittedById(cid)) void router.back()
  },
  { immediate: true },
)

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
const secondVoiceAudioRef = ref<HTMLAudioElement | null>(null)
const storyEditRef = ref<HTMLTextAreaElement | null>(null)
const bodyPrevOverflow = ref('')

const isThumbLiked = ref(false)
const isEditingStory = ref(false)
const editBuffer = ref('')

const likeIconSrc = computed(() => (isThumbLiked.value ? imgThumbsUpLiked : imgThumbsUp))

const FRAME_CSS_W = 390
const FRAME_CSS_H = PANEL_H

const paperTitle = computed(() => {
  if (isCardViewMode.value) return committedRow.value?.title?.trim() || '物品'
  return draftItemTitle.value
})

/** 纸条正文基准（不含长按星星的临时预览） */
const resolvedStoryWithoutStarPreview = computed(() => {
  if (isCardViewMode.value) {
    const t = committedRow.value?.storyText?.trim()
    if (t) return t
    return DEFAULT_STORY_LINES.join('\n')
  }
  const t = draftStoryText.value.trim()
  if (t) return t
  return DEFAULT_STORY_LINES.join('\n')
})

/** 长按星星：临时展示随机一首，松手恢复 {@link resolvedStoryWithoutStarPreview} */
const starHoldPreviewText = ref<string | null>(null)

const displayStory = computed(() => {
  const p = starHoldPreviewText.value
  if (p != null) return p
  return resolvedStoryWithoutStarPreview.value
})

const STAR_LONG_PRESS_MS = 450
let starPressActive = false
let starLongPressFired = false
let starLongPressTimer: ReturnType<typeof setTimeout> | null = null

function clearStarLongPressTimer() {
  if (starLongPressTimer != null) {
    clearTimeout(starLongPressTimer)
    starLongPressTimer = null
  }
}

function onStarPointerDown(e: PointerEvent) {
  if (isEditingStory.value) return
  if (e.button !== undefined && e.button !== 0) return
  starPressActive = true
  starLongPressFired = false
  clearStarLongPressTimer()
  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  starLongPressTimer = setTimeout(() => {
    starLongPressTimer = null
    if (!starPressActive || starLongPressFired) return
    starLongPressFired = true
    const base = resolvedStoryWithoutStarPreview.value.replace(/\r\n/g, '\n').trim()
    starHoldPreviewText.value = pickRandomPoemText(base)
  }, STAR_LONG_PRESS_MS)
}

function endStarLongPress(e: PointerEvent) {
  clearStarLongPressTimer()
  starPressActive = false
  starLongPressFired = false
  starHoldPreviewText.value = null
  const el = e.currentTarget as HTMLElement
  try {
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

function onStarPointerUp(e: PointerEvent) {
  endStarLongPress(e)
}

function onStarPointerCancel(e: PointerEvent) {
  endStarLongPress(e)
}

/** 第二屏：仅在有上传/已入库场景图时显示照片栏（不用占位图） */
const showSecondScene = computed(() => {
  if (isCardViewMode.value) return !!committedRow.value?.sceneImageUrl
  return draftGalleryObjectUrls.value.length > 0
})

const secondSceneSrc = computed(() => {
  if (isCardViewMode.value) return committedRow.value?.sceneImageUrl ?? ''
  return draftGalleryObjectUrls.value[0] ?? ''
})

const showSecondVoice = computed(() => {
  if (isCardViewMode.value) return false
  return !!draftVoiceObjectUrl.value
})

const secondVoicePlaySrc = computed(() => draftVoiceObjectUrl.value ?? '')

const secondCenterChat = computed(() => !showSecondVoice.value && !showSecondScene.value)

const secondChatUserLines = computed(() => {
  if (isCardViewMode.value) {
    const t = committedRow.value?.storyText?.trim()
    if (!t) return []
    return t
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [...draftChatUserLines.value]
})

const heroSrc = computed(() => {
  if (isCardViewMode.value) return committedRow.value?.imageUrl ?? null
  return pendingCaptureObjectUrl.value
})

function updateFrameScale() {
  const root = rootRef.value
  const frame = frameRef.value
  if (!root || !frame) return
  const rw = root.clientWidth
  const rh = root.clientHeight
  if (rw <= 0 || rh <= 0) return
  const s = Math.min(rw / FRAME_CSS_W, rh / FRAME_CSS_H)
  frame.style.transform = `scale(${s})`
}

function onWindowResize() {
  updateFrameScale()
}

/** 与 scroll-snap 配合：瞬间对齐到下一屏，用户可再自然上滑回第一屏 */
function onScrollToSecondPanel() {
  const el = viewportRef.value
  if (!el) return
  el.scrollTo({ top: PANEL_H, behavior: 'auto' })
}

function onPrimaryDone() {
  if (isCardViewMode.value) {
    void router.back()
    return
  }
  void itemStore.commitCurrentItemFromCard().finally(() => {
    const loc = itemStore.consumeAfterCardNavigation()
    void router.push(loc ?? { name: 'carrier-list' })
  })
}

function onIconLike() {
  if (isCardViewMode.value) return
  commitStoryEdit()
  isThumbLiked.value = !isThumbLiked.value
}

function pickRandomPoemText(excludeNormalized: string): string {
  const n = POEM_VARIANTS.length
  if (n === 0) return excludeNormalized
  let next = POEM_VARIANTS[Math.floor(Math.random() * n)]!
  let guard = 0
  while (next.replace(/\r\n/g, '\n').trim() === excludeNormalized && n > 1 && guard < 32) {
    next = POEM_VARIANTS[Math.floor(Math.random() * n)]!
    guard += 1
  }
  return next
}

function onIconRepeat() {
  if (isCardViewMode.value) return
  commitStoryEdit()
  const raw = draftStoryText.value.trim()
    ? draftStoryText.value
    : DEFAULT_STORY_LINES.join('\n')
  const exclude = raw.replace(/\r\n/g, '\n').trim()
  const next = pickRandomPoemText(exclude)
  itemStore.setDraftStoryText(next)
}

function onIconEdit() {
  if (isCardViewMode.value) {
    const row = committedRow.value
    if (!row) return
    isEditingStory.value = true
    const t = row.storyText?.trim()
    editBuffer.value = t ? row.storyText! : DEFAULT_STORY_LINES.join('\n')
  } else {
    isEditingStory.value = true
    editBuffer.value = draftStoryText.value.trim()
      ? draftStoryText.value
      : DEFAULT_STORY_LINES.join('\n')
  }
  void nextTick(() => {
    const el = storyEditRef.value
    if (!el) return
    el.focus()
    const len = el.value.length
    el.setSelectionRange(len, len)
  })
}

function commitStoryEdit() {
  if (!isEditingStory.value) return
  isEditingStory.value = false
  if (isCardViewMode.value) {
    const id = committedIdParam.value
    if (id) itemStore.updateCommittedStoryText(id, editBuffer.value)
    return
  }
  itemStore.setDraftStoryText(editBuffer.value)
}

function onStoryEditBlur() {
  commitStoryEdit()
}

function onSecondVoiceHitClick() {
  const a = secondVoiceAudioRef.value
  if (!a) return
  if (a.paused) void a.play().catch(() => {})
  else a.pause()
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  void nextTick().then(() => {
    updateFrameScale()
    const el = viewportRef.value
    if (el) el.scrollTop = 0
  })
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  document.body.style.overflow = bodyPrevOverflow.value
  clearStarLongPressTimer()
  starPressActive = false
  starLongPressFired = false
  starHoldPreviewText.value = null
})
</script>

<template>
  <div ref="rootRef" class="item-card-gen">
    <div ref="frameRef" class="item-card-gen__frame">
      <div class="item-card-gen__stage">
        <div
          ref="viewportRef"
          class="item-card-gen__viewport"
        >
          <!-- 上屏：白底 → 点阵 → 内容（头像/诗句等） -->
          <section class="item-card-gen__panel item-card-gen__panel--snap item-card-gen__panel--first">
            <div class="item-card-gen__first-bg" aria-hidden="true">
              <div
                class="item-card-gen__stage-bg-art"
                :style="{ backgroundImage: `url(${imgCardStageBg})` }"
              />
            </div>
            <div class="item-card-gen__panel-inner item-card-gen__panel-inner--top">
              <div class="item-card-gen__first-stack">
                <div class="item-card-gen__paper-wrap">
                  <img :src="imgPaper" alt="" class="item-card-gen__paper-img" draggable="false" >
                  <div class="item-card-gen__paper-overlay-anchor">
                    <div class="item-card-gen__paper-overlay">
                      <p class="item-card-gen__paper-title">
                        「{{ paperTitle }}」
                      </p>
                      <textarea
                        v-if="isEditingStory"
                        ref="storyEditRef"
                        v-model="editBuffer"
                        class="item-card-gen__paper-body item-card-gen__paper-body--edit"
                        rows="10"
                        aria-label="编辑诗句"
                        @blur="onStoryEditBlur"
                      />
                      <p v-else class="item-card-gen__paper-body">
                        {{ displayStory }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="item-card-gen__first-tail">
                  <div
                    class="item-card-gen__actions"
                    :class="{ 'item-card-gen__actions--solo': isCardViewMode }"
                    role="toolbar"
                    aria-label="卡片操作"
                  >
                    <template v-if="!isCardViewMode">
                      <button type="button" class="item-card-gen__icon-btn" aria-label="喜欢" @click="onIconLike">
                        <img :src="likeIconSrc" alt="" width="34" height="34" >
                      </button>
                      <button type="button" class="item-card-gen__icon-btn" aria-label="再发一版" @click="onIconRepeat">
                        <img :src="imgRepeat" alt="" width="34" height="34" >
                      </button>
                      <button type="button" class="item-card-gen__icon-btn" aria-label="编辑" @click="onIconEdit">
                        <img :src="imgCreate" alt="" width="34" height="34" >
                      </button>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="item-card-gen__icon-btn"
                      aria-label="编辑"
                      @click="onIconEdit"
                    >
                      <img :src="imgCreate" alt="" width="34" height="34" >
                    </button>
                  </div>

                  <button
                    type="button"
                    class="item-card-gen__star-hit"
                    aria-label="长按看看别人的故事"
                    @pointerdown="onStarPointerDown"
                    @pointerup="onStarPointerUp"
                    @pointercancel="onStarPointerCancel"
                    @contextmenu.prevent
                  >
                    <img :src="imgStar" alt="" class="item-card-gen__star" width="99" height="99" draggable="false" >
                  </button>
                  <p class="item-card-gen__social-line item-card-gen__social-line--a">
                    <span class="item-card-gen__social-line-a__muted">有 </span>
                    <span class="item-card-gen__social-line-a__num">{{ SOCIAL_FRIEND_COUNT }}</span>
                    <span class="item-card-gen__social-line-a__muted"> 个朋友和你有着相同的品味！</span>
                  </p>
                  <p class="item-card-gen__social-line item-card-gen__social-line--b">
                    长按看看别人的故事～
                  </p>
                  <button
                    type="button"
                    class="item-card-gen__down-btn"
                    aria-label="进入下一屏"
                    @click="onScrollToSecondPanel"
                  >
                    <img :src="imgChevron" alt="" width="29" height="29" >
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 下屏 -->
          <section class="item-card-gen__panel item-card-gen__panel--snap item-card-gen__panel--second">
            <div class="item-card-gen__second-bg" aria-hidden="true">
              <div
                class="item-card-gen__stage-bg-art"
                :style="{ backgroundImage: `url(${imgCardStageBg})` }"
              />
            </div>
            <div
              class="item-card-gen__panel-inner item-card-gen__panel-inner--bottom"
              :class="{ 'item-card-gen__panel-inner--bottom--view': isCardViewMode }"
            >
              <div class="item-card-gen__second-layout">
                <div
                  class="item-card-gen__second-scroll"
                  :class="{ 'item-card-gen__second-scroll--no-done': isCardViewMode }"
                >
                  <div
                    class="item-card-gen__second-stack"
                    :class="{ 'item-card-gen__second-stack--center-chat': secondCenterChat }"
                  >
                    <div v-if="heroSrc" class="item-card-gen__product-wrap">
                      <img :src="heroSrc" alt="" class="item-card-gen__product" draggable="false" >
                    </div>

                    <div v-if="showSecondVoice" class="item-card-gen__voice-block">
                      <button
                        type="button"
                        class="item-card-gen__voice-hit"
                        aria-label="播放或暂停语音"
                        @click="onSecondVoiceHitClick"
                      >
                        <img :src="imgVoice" alt="" class="item-card-gen__voice-deco" draggable="false" >
                      </button>
                      <audio
                        v-if="secondVoicePlaySrc"
                        ref="secondVoiceAudioRef"
                        :src="secondVoicePlaySrc"
                        preload="metadata"
                        class="item-card-gen__voice-audio-hidden"
                      />
                    </div>

                    <div v-if="showSecondScene" class="item-card-gen__scene-wrap">
                      <img :src="secondSceneSrc" alt="" class="item-card-gen__scene" draggable="false" >
                    </div>

                    <div class="item-card-gen__chat-records" role="log" aria-label="聊天记录">
                      <p class="item-card-gen__chat-ai">
                        {{ AI_CARD_PROMPT }}
                      </p>
                      <p
                        v-for="(line, idx) in secondChatUserLines"
                        :key="idx"
                        class="item-card-gen__chat-user"
                      >
                        {{ line }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-if="!isCardViewMode" class="item-card-gen__second-done-bar">
                  <button type="button" class="item-card-gen__done-hit" aria-label="完成" @click="onPrimaryDone">
                    <img
                      :src="imgDoneBtn"
                      alt=""
                      class="item-card-gen__done-img"
                      draggable="false"
                    >
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$item-gen-purple: #8b7dff;
$item-gen-paper-ink: #b0a090;
$item-gen-social-ink: #2c2c2c;

/* 第一屏主内容区（撕纸～下箭头）相对设计稿等比 1.3；点阵背景不缩放 */
$first-ui-scale: 1.3;
$first-stack-nudge-up: 16px;

/* 第二屏：语音条等宽约屏宽 80%；场景照 = 语音基准×0.8×0.8；Done = 半稿×1.5×0.8×0.8；均水平居中 */
$second-wide-max: 312px;
$second-photo-done-scale: 0.8;
$second-scene-max: $second-wide-max * 0.8 * $second-photo-done-scale;
$second-bottle-max-w: 132px;
$second-bottle-max-h: 170px;
$second-scene-radius: 26px * $second-photo-done-scale;
$second-done-btn-scale: 0.8;
$second-done-w: 108px * 1.5 * $second-photo-done-scale * $second-done-btn-scale;
$second-done-img-scale: 0.7;
$second-done-fixed-nudge-down: 100px;
$second-done-nudge-up: 16px;

.item-card-gen {
  position: fixed;
  inset: 0;
  z-index: 2;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  /* 允许第二屏 Done 下移后底缘略超出 844 稿，避免被裁切 */
  overflow-x: hidden;
  overflow-y: visible;
}

.item-card-gen__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  transform-origin: center center;
}

.item-card-gen__stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  /* Done 第二屏下移 100px 时底缘可能略超出面板，避免裁切 */
  overflow: visible;
}

.item-card-gen__panel--first {
  position: relative;
}

.item-card-gen__first-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #fff;
}

.item-card-gen__stage-bg-art {
  position: absolute;
  inset: 0;
  background-color: #fff;
  background-repeat: no-repeat;
  background-position: center top;
  background-size: cover;
}

.item-card-gen__panel--second {
  position: relative;
  background: #fff;
}

.item-card-gen__second-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #fff;
}

.item-card-gen__viewport {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow-x: visible;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.item-card-gen__panel {
  width: 100%;
  box-sizing: border-box;
}

.item-card-gen__panel--snap {
  min-height: 844px;
  height: 844px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.item-card-gen__panel-inner {
  min-height: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 22px;
  padding-right: 22px;
}

.item-card-gen__panel-inner--top {
  position: relative;
  z-index: 1;
  justify-content: center;
  padding-top: 8px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  overflow-x: visible;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

/* 整块（撕纸～下箭头）作为一组垂直居中，并略下移贴近参考稿 */
.item-card-gen__first-stack {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: calc(300px * #{$first-ui-scale});
  margin-top: calc(44px * #{$first-ui-scale} - #{$first-stack-nudge-up});
}

.item-card-gen__panel-inner--bottom {
  position: relative;
  z-index: 1;
  align-items: stretch;
  justify-content: flex-start;
  padding-top: 36px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 0;
  height: 100%;
  min-height: 0;

  &--view {
    padding-top: 52px;

    .item-card-gen__product-wrap {
      margin-bottom: 36px;
    }

    .item-card-gen__product {
      max-width: calc(#{$second-bottle-max-w} * 1.14);
      max-height: calc(#{$second-bottle-max-h} * 1.14);
    }

    .item-card-gen__scene-wrap {
      margin-top: 20px;
      margin-bottom: 24px;
    }
  }
}

/* 第二屏：可滚动内容区 + 底部固定 Done（再下移 $second-done-fixed-nudge-down 并贴底不随列表滚动） */
.item-card-gen__second-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}

.item-card-gen__second-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(
    72px + #{$second-done-fixed-nudge-down} - #{$second-done-nudge-up} + env(safe-area-inset-bottom, 0px)
  );
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

/* 从清单进入的查看态不展示底部 Done，去掉为其预留的大块底垫 */
.item-card-gen__second-scroll--no-done {
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px));
}

.item-card-gen__second-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 12px;
  flex: 1 0 auto;
  min-height: min-content;
}

.item-card-gen__second-stack--center-chat {
  min-height: 100%;

  .item-card-gen__chat-records {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 200px;
  }
}

.item-card-gen__second-done-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-top: 8px;
  padding-bottom: calc(40px + 16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.96) 70%, rgba(255, 255, 255, 0));
  pointer-events: none;
  transform: translateY(calc(#{$second-done-fixed-nudge-down} - #{$second-done-nudge-up}));

  .item-card-gen__done-hit {
    pointer-events: auto;
  }
}

.item-card-gen__chat-records {
  width: 100%;
  max-width: 320px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.item-card-gen__chat-ai {
  margin: 0;
  align-self: flex-start;
  max-width: 92%;
  padding: 10px 12px;
  border-radius: 14px 14px 14px 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-family: var(--font-family-app);
  font-size: 14px;
  line-height: 1.45;
  color: #333;
}

.item-card-gen__chat-user {
  margin: 0;
  align-self: flex-end;
  max-width: 92%;
  padding: 10px 12px;
  border-radius: 14px 14px 4px 14px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-family: var(--font-family-app);
  font-size: 14px;
  line-height: 1.45;
  color: #222;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}

.item-card-gen__paper-wrap {
  position: relative;
  width: 100%;
  max-width: calc(280px * #{$first-ui-scale});
  /* 在原有下移 36px 基础上再下移 36px；整体纸条+诗句相对当前再放大 1.2 倍 */
  /* 纸条底 ↔ 三图标：净增约 20px（另含抵消 first-tail 再上移 40px 的补偿） */
  margin: 72px auto calc(22px * #{$first-ui-scale} + 72px + 60px);
  flex-shrink: 0;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.07));
  transform: scale(1.2);
  transform-origin: center top;
}

.item-card-gen__paper-img {
  position: relative;
  z-index: 0;
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  pointer-events: none;
  user-select: none;
}

/* 诗句框在纸条内水平垂直居中；框体相对原稿缩至 0.8 */
.item-card-gen__paper-overlay-anchor {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.item-card-gen__paper-overlay {
  box-sizing: border-box;
  width: 78%;
  height: 56%;
  max-height: 56%;
  padding: calc(8px * #{$first-ui-scale}) calc(10px * #{$first-ui-scale})
    calc(12px * #{$first-ui-scale});
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transform: scale(0.8);
  transform-origin: center center;
  pointer-events: auto;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.item-card-gen__paper-title {
  margin: 0 0 calc(8px * #{$first-ui-scale});
  font-family: var(--font-family-app);
  font-size: calc(12px * #{$first-ui-scale});
  font-weight: 500;
  line-height: 1.45;
  color: $item-gen-paper-ink;
}

.item-card-gen__paper-body {
  margin: 0;
  font-family: var(--font-family-app);
  font-size: calc(10px * #{$first-ui-scale});
  font-weight: 400;
  line-height: 1.68;
  color: $item-gen-paper-ink;
  white-space: pre-wrap;

  &--edit {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-height: 8em;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    resize: none;
    outline: none;
    text-align: center;
    -webkit-appearance: none;
    appearance: none;
  }
}

/* 清单板块：再上移 40px（合计相对未设负 margin 时 −80px），内部缩放 0.8 */
.item-card-gen__first-tail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: -80px;
  transform: scale(0.8);
  transform-origin: top center;
  margin-bottom: -52px;
}

.item-card-gen__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: calc(40px * #{$first-ui-scale});
  flex-shrink: 0;
  /* +20px：三图标与星星之间的间距 */
  margin-bottom: calc(20px * #{$first-ui-scale} + 20px);

  &--solo {
    justify-content: center;
    gap: 0;
  }
}

.item-card-gen__icon-btn {
  margin: 0;
  padding: calc(4px * #{$first-ui-scale});
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  border-radius: calc(10px * #{$first-ui-scale});
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.72;
  }

  img {
    display: block;
    width: calc(26px * #{$first-ui-scale});
    height: calc(26px * #{$first-ui-scale});
    object-fit: contain;
  }
}

.item-card-gen__star-hit {
  margin: 0 0 calc(10px * #{$first-ui-scale});
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:active {
    opacity: 0.92;
  }
}

.item-card-gen__star {
  display: block;
  width: calc(76px * #{$first-ui-scale});
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.item-card-gen__social-line {
  margin: 0;
  text-align: center;
  line-height: 1.5;
  letter-spacing: 0.04em;
}

.item-card-gen__social-line--a {
  font-size: calc(14px * #{$first-ui-scale});
  font-family: var(--font-family-app);
}

.item-card-gen__social-line-a__muted {
  color: $item-gen-social-ink;
}

.item-card-gen__social-line-a__num {
  color: $item-gen-purple;
  font-weight: 700;
}

.item-card-gen__social-line--b {
  margin-top: calc(6px * #{$first-ui-scale});
  font-size: calc(12px * #{$first-ui-scale});
  color: $item-gen-purple;
  font-family: var(--font-family-app);
}

.item-card-gen__down-btn {
  flex-shrink: 0;
  margin: calc(14px * #{$first-ui-scale}) 0 0;
  padding: calc(8px * #{$first-ui-scale}) calc(20px * #{$first-ui-scale});
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  border-radius: calc(14px * #{$first-ui-scale});
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.75;
    transform: scale(0.96);
  }

  img {
    display: block;
    width: calc(22px * #{$first-ui-scale});
    height: calc(22px * #{$first-ui-scale});
    object-fit: contain;
  }
}

/* 上：抠图瓶子 — 全屏最窄，高度约一屏 20% */
.item-card-gen__product-wrap {
  width: auto;
  max-width: $second-bottle-max-w;
  margin: 0 auto 26px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.item-card-gen__product {
  display: block;
  max-width: $second-bottle-max-w;
  max-height: $second-bottle-max-h;
  width: auto;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

/* 语音：仅 Group 5 图，点击播放/暂停隐藏 audio（无第二条控件栏） */
.item-card-gen__voice-block {
  position: relative;
  width: 100%;
  max-width: $second-wide-max;
  margin: 0 auto 16px;
  flex-shrink: 0;
  transform: scale(0.85);
  transform-origin: top center;
}

.item-card-gen__voice-hit {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.88;
  }
}

.item-card-gen__voice-deco {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.item-card-gen__voice-audio-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* 场景照片 — 仅在有上传图时出现 */
.item-card-gen__scene-wrap {
  width: 100%;
  max-width: $second-scene-max;
  margin-left: auto;
  margin-right: auto;
  margin-top: 4px;
  margin-bottom: 16px;
  border-radius: $second-scene-radius;
  overflow: hidden;
  line-height: 0;
  flex-shrink: 0;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1);
}

.item-card-gen__scene {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  object-fit: cover;
}

.item-card-gen__done-hit {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
}

/* Done：基准宽 ×0.7（仅首次生成流程第二屏展示） */
.item-card-gen__done-img {
  display: block;
  width: calc(#{$second-done-w} * #{$second-done-img-scale});
  max-width: 100%;
  height: auto;
  margin-left: auto;
  margin-right: auto;
  object-fit: contain;
}
</style>
