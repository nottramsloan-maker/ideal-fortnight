<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useUserStore } from '@/stores/user'
import { avatarPresetPreviewStyle } from '@/domain/avatarPresets'
import imgGallery from '@/assets/figma/item-ai/btn-gallery.png'
import imgDotGrid from '@/assets/figma/item-ai/dot-grid.png'
import imgClose from '@/assets/figma/item-ai/icon-close.png'
import imgDone from '@/assets/figma/item-ai/btn-done.png'
import imgInputSketch from '@/assets/figma/item-ai/input-field-sketch.png'
import imgGalleryAdded from '@/assets/figma/item-ai/gallery-added-badge.png'
import imgAvatar from '@/assets/figma/item-ai/avatar.png'
import imgChatItemFallback from '@/assets/figma/item-ai/chat-item-reference.png'
import imgNameEdit from '@/assets/figma/item-ai/icon-name-edit.png'
import imgVoiceMic from '@/assets/figma/item-ai/btn-voice-mic.png'

const router = useRouter()
const route = useRoute()
const itemStore = useItemStore()
const userStore = useUserStore()
const { pendingCaptureObjectUrl, draftItemTitle, draftGalleryObjectUrls } = storeToRefs(itemStore)
const { avatarPresetId } = storeToRefs(userStore)

/** 与「你是谁？」预制头像一致；气泡内略大于旧稿 29px 以保清晰 */
const USER_BUBBLE_AVATAR_PX = 32

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const composerDockRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const chatFileRef = ref<HTMLInputElement | null>(null)
const voiceFileRef = ref<HTMLInputElement | null>(null)

const bodyPrevOverflow = ref('')
const messageDraft = ref('')
const nameInput = ref('')
const nameConfirmed = ref(false)
/** 点击小编辑图标后为 true，显示内联输入（无大输入框） */
const nameEditing = ref(false)

/** 与 OnboardingCarrier 相同的逐字出现节奏 */
const REVEAL_STEP_MS = 160
const REVEAL_START_DELAY_MS = 280

const NAME_PROMPT = '它叫什么名字？'
const STORY_PROMPT = '聊聊你和它有什么故事么？'
const namePromptChars = Array.from(NAME_PROMPT)
const storyPromptChars = Array.from(STORY_PROMPT)

const namePromptRevealCount = ref(0)
const storyPromptRevealCount = ref(0)
let nameRevealTimer: ReturnType<typeof setInterval> | undefined
let storyRevealTimer: ReturnType<typeof setInterval> | undefined

const thinkingNavActive = ref(false)
let thinkingNavTimer: ReturnType<typeof setTimeout> | undefined

type ChatLine = { id: number; text: string }
const chatLines = ref<ChatLine[]>([])
let chatLineId = 0

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

/** Done 后进入卡片页前的「thinking」全屏态时长 */
const THINKING_NAV_MS = 5000

/** Figma 161:10963 为四象限叠图模拟环；实现为 16 颗球均分一周 */
const THINKING_BALL_COUNT = 16
const thinkingBallIndices = Array.from({ length: THINKING_BALL_COUNT }, (_, i) => i)

const heroSrc = computed(() => pendingCaptureObjectUrl.value)
const thumbSrc = computed(() => heroSrc.value ?? imgChatItemFallback)

const userBubbleAvatarStyle = computed(() => {
  const style = avatarPresetPreviewStyle(avatarPresetId.value, USER_BUBBLE_AVATAR_PX)
  if (!style) return null
  return {
    ...style,
    borderRadius: '50%',
  }
})

const hasGalleryDraft = computed(() => draftGalleryObjectUrls.value.length > 0)

/** 设计稿坐标系下的缩放系数，用于把视觉视口键盘遮挡换算成 frame 内 translate */
const frameScale = ref(1)

function clearNameRevealTimer() {
  if (nameRevealTimer != null) {
    clearInterval(nameRevealTimer)
    nameRevealTimer = undefined
  }
}

function clearStoryRevealTimer() {
  if (storyRevealTimer != null) {
    clearInterval(storyRevealTimer)
    storyRevealTimer = undefined
  }
}

function startNamePromptReveal() {
  clearNameRevealTimer()
  namePromptRevealCount.value = 0
  window.setTimeout(() => {
    namePromptRevealCount.value = 1
    nameRevealTimer = window.setInterval(() => {
      if (namePromptRevealCount.value < namePromptChars.length) {
        namePromptRevealCount.value += 1
      } else {
        clearNameRevealTimer()
      }
    }, REVEAL_STEP_MS)
  }, REVEAL_START_DELAY_MS)
}

function startStoryPromptReveal() {
  clearStoryRevealTimer()
  storyPromptRevealCount.value = 0
  window.setTimeout(() => {
    storyPromptRevealCount.value = 1
    storyRevealTimer = window.setInterval(() => {
      if (storyPromptRevealCount.value < storyPromptChars.length) {
        storyPromptRevealCount.value += 1
      } else {
        clearStoryRevealTimer()
      }
    }, REVEAL_STEP_MS)
  }, REVEAL_START_DELAY_MS)
}

function updateFrameScale() {
  const root = rootRef.value
  const frame = frameRef.value
  if (!root || !frame) return
  const rw = root.clientWidth
  const rh = root.clientHeight
  if (rw <= 0 || rh <= 0) return
  const s = Math.min(rw / FRAME_CSS_W, rh / FRAME_CSS_H)
  frameScale.value = s
  frame.style.transform = `scale(${s})`
}

function updateComposerKeyboardShift() {
  const dock = composerDockRef.value
  if (!dock) return
  const vv = window.visualViewport
  if (!vv) {
    dock.style.transform = ''
    return
  }
  const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  if (overlap <= 0) {
    dock.style.transform = ''
    return
  }
  const s = frameScale.value || 1
  dock.style.transform = `translateY(-${overlap / s}px)`
}

function onWindowResize() {
  updateFrameScale()
  updateComposerKeyboardShift()
}

function onVisualViewportChange() {
  updateComposerKeyboardShift()
}

function onClose() {
  router.back()
}

function onRepeat() {
  clearNameRevealTimer()
  clearStoryRevealTimer()
  nameConfirmed.value = false
  nameEditing.value = false
  nameInput.value = ''
  messageDraft.value = ''
  chatLines.value = []
  draftItemTitle.value = 'Spirit Drink'
  itemStore.clearDraftStoryAndGallery()
  void nextTick().then(() => startNamePromptReveal())
}

function openNameEdit() {
  nameEditing.value = true
  void nextTick().then(() => nameInputRef.value?.focus())
}

function confirmName() {
  const t = nameInput.value.trim()
  if (!t) return
  draftItemTitle.value = t
  nameConfirmed.value = true
  nameEditing.value = false
  startStoryPromptReveal()
}

function syncDraftStoryToStore() {
  const lines = chatLines.value.map((l) => l.text)
  itemStore.setDraftStoryText(lines.join('\n'))
  itemStore.setDraftChatUserLines(lines)
}

function onMessageKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'Enter') return
  ev.preventDefault()
  if (!nameConfirmed.value) return
  const t = messageDraft.value.trim()
  if (!t) return
  chatLines.value.push({ id: ++chatLineId, text: t })
  messageDraft.value = ''
  syncDraftStoryToStore()
}

function openChatGallery() {
  chatFileRef.value?.click()
}

function onChatFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) itemStore.addDraftGalleryFile(file)
  input.value = ''
}

function openVoicePicker() {
  voiceFileRef.value?.click()
}

function onVoiceFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) itemStore.setDraftVoiceFromFile(file)
  input.value = ''
}

function onDone() {
  if (thinkingNavActive.value) return
  syncDraftStoryToStore()
  thinkingNavActive.value = true
  if (thinkingNavTimer != null) clearTimeout(thinkingNavTimer)
  thinkingNavTimer = window.setTimeout(() => {
    thinkingNavTimer = undefined
    const raw = route.params.id
    const idStr = Array.isArray(raw) ? (raw[0] ?? 'new') : (raw ?? 'new')
    void router.push({
      name: 'item-card',
      params: { id: idStr },
    })
  }, THINKING_NAV_MS)
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  void nextTick().then(() => {
    updateFrameScale()
    updateComposerKeyboardShift()
  })
  window.addEventListener('resize', onWindowResize)
  window.visualViewport?.addEventListener('resize', onVisualViewportChange)
  window.visualViewport?.addEventListener('scroll', onVisualViewportChange)
  startNamePromptReveal()
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  window.visualViewport?.removeEventListener('resize', onVisualViewportChange)
  window.visualViewport?.removeEventListener('scroll', onVisualViewportChange)
  clearNameRevealTimer()
  clearStoryRevealTimer()
  if (thinkingNavTimer != null) {
    clearTimeout(thinkingNavTimer)
    thinkingNavTimer = undefined
  }
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div ref="rootRef" class="item-ai-chat">
    <div ref="frameRef" class="item-ai-chat__frame">
      <div class="item-ai-chat__stage">
        <!-- 顶部：缩小图 + 正下方「它叫什么名字？」 -->
        <div class="item-ai-chat__top-stack">
          <div class="item-ai-chat__thumb-wrap" @click.stop>
            <img
              :src="thumbSrc"
              alt=""
              class="item-ai-chat__thumb-img"
              draggable="false"
            >
          </div>

          <h2 class="item-ai-chat__prompt item-ai-chat__prompt--name" :aria-label="NAME_PROMPT">
            <span
              v-for="(ch, i) in namePromptChars"
              :key="`np-${i}`"
              class="item-ai-chat__title-char"
              :class="{ 'item-ai-chat__title-char--show': namePromptRevealCount > i }"
            >{{ ch }}</span>
          </h2>

          <!-- 名称：点小编辑图标输入；完成后名字显示在此区域 -->
          <div class="item-ai-chat__name-slot" role="group" aria-label="物品名称">
            <template v-if="!nameConfirmed">
              <button
                v-if="!nameEditing"
                type="button"
                class="item-ai-chat__name-edit-hit"
                aria-label="输入名字"
                @click="openNameEdit"
              >
                <img
                  :src="imgNameEdit"
                  alt=""
                  class="item-ai-chat__name-edit-icon"
                  width="22"
                  height="22"
                  draggable="false"
                >
              </button>
              <div v-else class="item-ai-chat__name-inline">
                <input
                  ref="nameInputRef"
                  v-model="nameInput"
                  type="text"
                  class="item-ai-chat__name-input-inline"
                  placeholder="输入名字"
                  enterkeyhint="done"
                  autocomplete="off"
                  @keydown.enter.prevent="confirmName"
                >
                <button
                  type="button"
                  class="item-ai-chat__name-inline-ok"
                  aria-label="确定名称"
                  @click="confirmName"
                >
                  确定
                </button>
              </div>
            </template>
            <p v-else class="item-ai-chat__name-done">
              {{ draftItemTitle }}
            </p>
          </div>
        </div>

        <!-- Dot Grid -->
        <div
          class="item-ai-chat__dot-grid"
          :style="{ backgroundImage: `url(${imgDotGrid})` }"
        />

        <!-- 点阵区内：AI 左气泡 + 用户右气泡（随文案伸缩） -->
        <div class="item-ai-chat__chat-thread" role="log" aria-live="polite">
          <div v-show="nameConfirmed" class="item-ai-chat__msg-row item-ai-chat__msg-row--ai">
            <div class="item-ai-chat__bubble-ai" :aria-label="STORY_PROMPT">
              <span
                v-for="(ch, i) in storyPromptChars"
                :key="`sp-${i}`"
                class="item-ai-chat__title-char item-ai-chat__title-char--in-bubble"
                :class="{ 'item-ai-chat__title-char--show': storyPromptRevealCount > i }"
              >{{ ch }}</span>
            </div>
          </div>

          <div
            v-for="line in chatLines"
            :key="line.id"
            class="item-ai-chat__msg-row item-ai-chat__msg-row--user"
          >
            <div class="item-ai-chat__user-cluster">
              <div class="item-ai-chat__bubble-user">
                <p class="item-ai-chat__bubble-user-text">{{ line.text }}</p>
              </div>
              <div class="item-ai-chat__user-avatar-wrap">
                <div
                  v-if="userBubbleAvatarStyle"
                  class="item-ai-chat__user-avatar item-ai-chat__user-avatar--preset"
                  :style="userBubbleAvatarStyle"
                  role="img"
                  aria-label="我的头像"
                />
                <img
                  v-else
                  :src="imgAvatar"
                  alt=""
                  class="item-ai-chat__user-avatar item-ai-chat__user-avatar--img"
                  width="32"
                  height="32"
                  draggable="false"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 底栏整块：工具行 + 相册/输入/Done；键盘弹出时整体上移 -->
        <div ref="composerDockRef" class="item-ai-chat__composer-dock">
          <nav class="item-ai-chat__bottom-icons" aria-label="操作">
            <button
              type="button"
              class="item-ai-chat__toolbar-btn item-ai-chat__repeat"
              aria-label="重试"
              @click="onRepeat"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5.5 10.5a6.5 6.5 0 1 1 2.2 4.9"
                  stroke="#7C66FF"
                  stroke-width="2"
                  stroke-linecap="round"
                  fill="none"
                />
                <path
                  d="M5 6v4.5h4.5"
                  stroke="#7C66FF"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            <button
              type="button"
              class="item-ai-chat__toolbar-btn item-ai-chat__mic-hit"
              aria-label="语音输入"
              @click="openVoicePicker"
            >
              <img
                :src="imgVoiceMic"
                alt=""
                class="item-ai-chat__mic-img"
                width="64"
                height="64"
                draggable="false"
              >
            </button>

            <button
              type="button"
              class="item-ai-chat__toolbar-btn item-ai-chat__close"
              aria-label="关闭"
              @click="onClose"
            >
              <img :src="imgClose" alt="" width="28" height="28" >
            </button>
          </nav>

          <div class="item-ai-chat__gallery-wrap">
            <button
              type="button"
              class="item-ai-chat__gallery-hit"
              aria-label="上传图片"
              @click="openChatGallery"
            >
              <img :src="imgGallery" alt="" width="96" height="84" >
            </button>
            <img
              v-show="hasGalleryDraft"
              :src="imgGalleryAdded"
              alt=""
              class="item-ai-chat__gallery-added-badge"
              width="20"
              height="20"
              draggable="false"
            >
          </div>

          <div
            class="item-ai-chat__input-wrap"
            :style="{ backgroundImage: `url(${imgInputSketch})` }"
          >
            <input
              v-model="messageDraft"
              type="text"
              class="item-ai-chat__input"
              :class="{ 'item-ai-chat__input--locked': !nameConfirmed }"
              :placeholder="nameConfirmed ? '发消息...' : ''"
              enterkeyhint="enter"
              autocomplete="off"
              :readonly="!nameConfirmed"
              inputmode="text"
              @keydown="onMessageKeydown"
              @focus="updateComposerKeyboardShift"
              @blur="updateComposerKeyboardShift"
            >
          </div>

          <button type="button" class="item-ai-chat__done" aria-label="完成" @click="onDone">
            <img :src="imgDone" alt="" width="72" height="46" >
          </button>

          <input
            ref="chatFileRef"
            type="file"
            class="item-ai-chat__file"
            accept="image/*"
            @change="onChatFileChange"
          >
          <input
            ref="voiceFileRef"
            type="file"
            class="item-ai-chat__file"
            accept="audio/*"
            @change="onVoiceFileChange"
          >
        </div>
      </div>
    </div>

    <!-- 全视口遮罩；Figma 161:10963 透视环 + 文案；转动周期 = 2.75s÷0.8，整段 5s 后跳转 -->
    <div
      v-show="thinkingNavActive"
      class="item-ai-chat__thinking-veil"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="item-ai-chat__thinking-body">
        <div class="item-ai-chat__thinking-scene" aria-hidden="true">
          <div class="item-ai-chat__thinking-rotor">
            <span
              v-for="i in thinkingBallIndices"
              :key="i"
              class="item-ai-chat__thinking-ball"
            />
          </div>
        </div>
        <p class="item-ai-chat__thinking-label">thinking……</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&display=swap');

/* AI 对话 — 坐标与尺寸严格按稿 */

$item-ai-font: var(--font-family-app);
$item-ai-purple: #8470ff;
$item-ai-purple-icon: #7c66ff;
$item-ai-placeholder: #979797;

.item-ai-chat {
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
  overflow: hidden;
}

.item-ai-chat__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  background: #ffffff;
  transform-origin: center center;
}

.item-ai-chat__stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
}

/* 顶部：缩小图 + 紧接下方文案 */
.item-ai-chat__top-stack {
  position: absolute;
  left: 0;
  right: 0;
  top: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.item-ai-chat__thumb-wrap {
  position: relative;
  line-height: 0;
  flex-shrink: 0;
}

.item-ai-chat__thumb-img {
  display: block;
  width: 112px;
  height: 112px;
  object-fit: contain;
}

/* 与 OnboardingCarrier 一致的逐字蹦出 */
.item-ai-chat__title-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.22s ease-out,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.item-ai-chat__title-char--show {
  opacity: 1;
  transform: translateY(0);
}

.item-ai-chat__prompt {
  position: absolute;
  left: 24px;
  right: 24px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  align-items: flex-end;
  justify-content: center;
  text-align: center;
  font-family: $item-ai-font;
  font-style: normal;
  font-weight: 400;
  font-size: 18.0556px;
  line-height: 26px;
  color: #000000;
  z-index: 1;
}

.item-ai-chat__top-stack .item-ai-chat__prompt--name {
  position: static;
  left: auto;
  right: auto;
  width: 100%;
  min-height: 0;
  padding: 0 20px;
  box-sizing: border-box;
  color: #979797;
}

.item-ai-chat__name-slot {
  position: static;
  transform: none;
  min-width: 120px;
  max-width: 300px;
  min-height: 36px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-ai-chat__name-edit-hit {
  margin: 0;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.item-ai-chat__name-edit-icon {
  display: block;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.item-ai-chat__name-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 280px;
}

.item-ai-chat__name-input-inline {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 6px 0 4px;
  box-sizing: border-box;
  font-family: $item-ai-font;
  font-size: 17px;
  line-height: 1.2;
  border: none;
  border-bottom: 1.5px solid $item-ai-purple-icon;
  border-radius: 0;
  background: transparent;
  color: #000;

  &::placeholder {
    color: $item-ai-placeholder;
  }

  &:focus {
    outline: none;
  }
}

.item-ai-chat__name-inline-ok {
  flex-shrink: 0;
  margin: 0;
  padding: 4px 2px;
  border: none;
  background: transparent;
  font-family: $item-ai-font;
  font-size: 15px;
  font-weight: 600;
  color: $item-ai-purple-icon;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.item-ai-chat__name-done {
  margin: 0;
  padding: 0 4px;
  max-width: 280px;
  text-align: center;
  font-family: $item-ai-font;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  color: #000;
}

/* 底栏组件层：与 frame 同大，子元素仍按设计稿坐标；键盘时用 transform 整体上移 */
.item-ai-chat__composer-dock {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 4;
  transition: transform 0.2s ease-out;
}

.item-ai-chat__composer-dock .item-ai-chat__bottom-icons,
.item-ai-chat__composer-dock .item-ai-chat__gallery-wrap,
.item-ai-chat__composer-dock .item-ai-chat__gallery-hit,
.item-ai-chat__composer-dock .item-ai-chat__input-wrap,
.item-ai-chat__composer-dock .item-ai-chat__done {
  pointer-events: auto;
}

/* 底部三键：略放大、左右贴边；整体上移为下一行加高留高 */
.item-ai-chat__bottom-icons {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 84px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 8px;
  box-sizing: border-box;
  z-index: 3;
}

.item-ai-chat__toolbar-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.item-ai-chat__repeat {
  width: 28px;
  height: 28px;
}

.item-ai-chat__mic-hit {
  width: 64px;
  height: 64px;
}

.item-ai-chat__mic-img {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: contain;
  pointer-events: none;
}

.item-ai-chat__close {
  width: 28px;
  height: 28px;

  img {
    display: block;
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
}

/* Dot Grid */
.item-ai-chat__dot-grid {
  position: absolute;
  left: 25px;
  top: 300px;
  width: 340px;
  height: 420px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 340px 340px;
  pointer-events: none;
  z-index: 0;
}

/* AI 对话框：左下尖角（与设计稿 AI 气泡一致）；用户对话框：右下尖角 */
.item-ai-chat__chat-thread {
  position: absolute;
  left: 25px;
  top: 280px;
  width: 340px;
  height: 420px;
  box-sizing: border-box;
  padding: 12px 0 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 2;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.item-ai-chat__msg-row {
  display: flex;
  width: 100%;
}

.item-ai-chat__msg-row--ai {
  justify-content: flex-start;
}

.item-ai-chat__msg-row--user {
  justify-content: flex-end;
}

/* 用户消息：外层随内容收缩；白底圆角仅包住文案气泡，头像在右侧栏、与气泡底对齐 */
.item-ai-chat__user-cluster {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 100%;
  flex-shrink: 0;
}

.item-ai-chat__bubble-ai {
  max-width: min(280px, 100%);
  padding: 11px 14px 12px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 18px 18px 18px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  text-align: left;
}

.item-ai-chat__bubble-user {
  display: inline-block;
  flex-shrink: 0;
  /* 勿用 calc(100% - 40px)：父级为 shrink-to-fit 的 inline-flex，百分比宽度会形成循环，短句也会被压成极窄条 */
  max-width: 268px;
  padding: 10px 12px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 18px 18px 0 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  vertical-align: bottom;
}

.item-ai-chat__bubble-user-text {
  margin: 0;
  font-family: $item-ai-font;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: #000;
  word-break: break-word;
  white-space: pre-wrap;
}

.item-ai-chat__user-avatar-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}

.item-ai-chat__title-char--in-bubble {
  font-size: 15px;
  line-height: 1.45;
  color: #000;
}

.item-ai-chat__user-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

.item-ai-chat__user-avatar--preset {
  overflow: hidden;
  background-repeat: no-repeat;
}

.item-ai-chat__user-avatar--img {
  display: block;
  object-fit: cover;
}

/* 相册 + 已选图角标（角标叠在按钮右下，仅暂存、不自动发送） */
.item-ai-chat__gallery-wrap {
  position: absolute;
  left: -8px;
  top: 760px;
  width: 96px;
  height: 84px;
}

.item-ai-chat__gallery-hit {
  position: absolute;
  left: 0;
  top: 0;
  width: 96px;
  height: 84px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  img {
    display: block;
    width: 96px;
    height: 84px;
    object-fit: contain;
    pointer-events: none;
  }
}

.item-ai-chat__gallery-added-badge {
  position: absolute;
  right: 4px;
  bottom: 6px;
  width: 22px;
  height: 22px;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18));
  transform: scale(0.6);
  transform-origin: bottom right;
}

/* 输入框底图（设计稿 输入框.png） */
.item-ai-chat__input-wrap {
  position: absolute;
  left: 101px;
  top: 776px;
  width: 194px;
  height: 48px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  box-sizing: border-box;
}

.item-ai-chat__input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 12px 10px 10px 8px;
  box-sizing: border-box;
  border: none;
  background: transparent;
  font-family: $item-ai-font;
  font-style: normal;
  font-weight: 400;
  font-size: 18.0556px;
  line-height: 22px;
  color: #000;

  &::placeholder {
    color: $item-ai-placeholder;
    font-family: $item-ai-font;
  }

  &--locked {
    opacity: 0.45;
  }
}

/* Group 10 Done */
.item-ai-chat__done {
  position: absolute;
  left: 312px;
  top: 777px;
  width: 72px;
  height: 46px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  img {
    display: block;
    width: 72px;
    height: 46px;
    object-fit: contain;
    pointer-events: none;
  }
}

.item-ai-chat__file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* —— thinking 加载（Figma 161:10963：四组 a/b/c/d 弧段位图叠成透视环；CSS 用 16 球 + perspective 近似）—— */
$item-ai-thinking-perspective: 300px;
$item-ai-thinking-r: 78px;
/* 原一圈约 2.75s；转速 ×0.8 → 周期 ÷0.8 */
$item-ai-thinking-spin-period: calc(2.75s / 0.8);

.item-ai-chat__thinking-veil {
  position: fixed;
  inset: 0;
  z-index: 20;
  box-sizing: border-box;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  /* 遮罩：#3C3C43 @ 42% */
  background: rgba(60, 60, 67, 0.42);
}

.item-ai-chat__thinking-body {
  position: relative;
  width: min(340px, 100vw - 48px);
  max-width: 340px;
  min-height: 280px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 32px 16px 40px;
}

.item-ai-chat__thinking-scene {
  width: 240px;
  height: 96px;
  perspective: $item-ai-thinking-perspective;
  perspective-origin: 50% 40%;
  overflow: visible;
  transform: rotateX(12deg);
  transform-style: preserve-3d;
}

.item-ai-chat__thinking-rotor {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: item-ai-thinking-rotate $item-ai-thinking-spin-period linear infinite;
}

.item-ai-chat__thinking-ball {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border-radius: 50%;
  transform-style: preserve-3d;
  background: #ffffff;
  box-shadow: none;
  filter: none;
  backface-visibility: visible;
}

@for $i from 1 through 16 {
  .item-ai-chat__thinking-ball:nth-child(#{$i}) {
    transform: rotateY(#{($i - 1) * 22.5}deg) translateZ($item-ai-thinking-r);
  }
}

.item-ai-chat__thinking-label {
  margin: 0;
  font-family: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 11px;
  line-height: 1.25;
  letter-spacing: 0.04em;
  color: #ffffff;
}

@keyframes item-ai-thinking-rotate {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(-360deg);
  }
}
</style>
