<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import imgGallery from '@/assets/figma/item-ai/btn-gallery.png'
import imgDotGrid from '@/assets/figma/item-ai/dot-grid.png'
import imgClose from '@/assets/figma/item-ai/icon-close.png'
import imgDone from '@/assets/figma/item-ai/btn-done.png'
import imgInputBg from '@/assets/figma/item-ai/input-bg.png'
import imgBubble from '@/assets/figma/item-ai/bubble.png'
import imgAvatar from '@/assets/figma/item-ai/avatar.png'
import imgChatItemFallback from '@/assets/figma/item-ai/chat-item-reference.png'
import imgNameEdit from '@/assets/figma/item-ai/icon-name-edit.png'
import imgVoiceMic from '@/assets/figma/item-ai/btn-voice-mic.png'

const router = useRouter()
const itemStore = useItemStore()
const { pendingCaptureObjectUrl, draftItemTitle } = storeToRefs(itemStore)

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const chatFileRef = ref<HTMLInputElement | null>(null)

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
const STORY_PROMPT = '【聊聊你和它有什么故事么？】'
const namePromptChars = Array.from(NAME_PROMPT)
const storyPromptChars = Array.from(STORY_PROMPT)

const namePromptRevealCount = ref(0)
const storyPromptRevealCount = ref(0)
let nameRevealTimer: ReturnType<typeof setInterval> | undefined
let storyRevealTimer: ReturnType<typeof setInterval> | undefined

type ChatLine = { id: number; text: string }
const chatLines = ref<ChatLine[]>([])
let chatLineId = 0

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

const heroSrc = computed(() => pendingCaptureObjectUrl.value)
const thumbSrc = computed(() => heroSrc.value ?? imgChatItemFallback)

const lastUserBubbleText = computed(() => {
  const lines = chatLines.value
  if (!lines.length) return ''
  return lines[lines.length - 1].text
})

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
  frame.style.transform = `scale(${s})`
}

function onWindowResize() {
  updateFrameScale()
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

function onMessageKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'Enter') return
  ev.preventDefault()
  if (!nameConfirmed.value) return
  const t = messageDraft.value.trim()
  if (!t) return
  chatLines.value.push({ id: ++chatLineId, text: t })
  messageDraft.value = ''
}

function openChatGallery() {
  chatFileRef.value?.click()
}

function onChatFileChange() {
  const input = chatFileRef.value
  if (input) input.value = ''
}

function onDone() {
  router.push({ name: 'carrier-list' })
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  void nextTick().then(() => updateFrameScale())
  window.addEventListener('resize', onWindowResize)
  startNamePromptReveal()
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  clearNameRevealTimer()
  clearStoryRevealTimer()
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

        <!-- 底部三个小标：同一行底对齐 -->
        <nav class="item-ai-chat__bottom-icons" aria-label="操作">
          <button
            type="button"
            class="item-ai-chat__toolbar-btn item-ai-chat__repeat"
            aria-label="重试"
            @click="onRepeat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
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
          >
            <img
              :src="imgVoiceMic"
              alt=""
              class="item-ai-chat__mic-img"
              width="28"
              height="28"
              draggable="false"
            >
          </button>

          <button
            type="button"
            class="item-ai-chat__toolbar-btn item-ai-chat__close"
            aria-label="关闭"
            @click="onClose"
          >
            <img :src="imgClose" alt="" width="24" height="24" >
          </button>
        </nav>

        <!-- Dot Grid -->
        <div
          class="item-ai-chat__dot-grid"
          :style="{ backgroundImage: `url(${imgDotGrid})` }"
        />

        <!-- 第二行：在点阵上方、左对齐（参考稿） -->
        <h2
          v-show="nameConfirmed"
          class="item-ai-chat__prompt item-ai-chat__prompt--story"
          :aria-label="STORY_PROMPT"
        >
          <span
            v-for="(ch, i) in storyPromptChars"
            :key="`sp-${i}`"
            class="item-ai-chat__title-char"
            :class="{ 'item-ai-chat__title-char--show': storyPromptRevealCount > i }"
          >{{ ch }}</span>
        </h2>

        <!-- 仅在有发送内容后显示对话气泡 -->
        <div v-if="chatLines.length > 0" class="item-ai-chat__bubble-wrap">
          <img :src="imgBubble" alt="" class="item-ai-chat__bubble" >
          <div class="item-ai-chat__bubble-fill">
            <p v-if="lastUserBubbleText" class="item-ai-chat__bubble-text">
              {{ lastUserBubbleText }}
            </p>
          </div>
          <img :src="imgAvatar" alt="" class="item-ai-chat__bubble-avatar" >
        </div>

        <!-- 底部相册 -->
        <button
          type="button"
          class="item-ai-chat__gallery-hit"
          aria-label="上传图片"
          @click="openChatGallery"
        >
          <img :src="imgGallery" alt="" width="85" height="75" >
        </button>

        <!-- Group 19 输入区 -->
        <div
          class="item-ai-chat__input-wrap"
          :style="{ backgroundImage: `url(${imgInputBg})` }"
        >
          <input
            v-model="messageDraft"
            type="text"
            class="item-ai-chat__input"
            :class="{ 'item-ai-chat__input--locked': !nameConfirmed }"
            placeholder=""
            enterkeyhint="enter"
            autocomplete="off"
            :readonly="!nameConfirmed"
            inputmode="text"
            @keydown="onMessageKeydown"
          >
        </div>

        <!-- Group 10 Done -->
        <button type="button" class="item-ai-chat__done" aria-label="完成" @click="onDone">
          <img :src="imgDone" alt="" width="67" height="42" >
        </button>

        <input
          ref="chatFileRef"
          type="file"
          class="item-ai-chat__file"
          accept="image/*"
          @change="onChatFileChange"
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

/* 点阵上方、左对齐 */
.item-ai-chat__prompt--story {
  top: 342px;
  left: 25px;
  right: 24px;
  width: auto;
  min-height: 52px;
  justify-content: flex-start;
  text-align: left;
  z-index: 2;
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

/* 底部三键：与底栏留白，图标底边对齐 */
.item-ai-chat__bottom-icons {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 76px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 25px;
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
  width: 24px;
  height: 24px;
}

.item-ai-chat__mic-hit {
  width: 28px;
  height: 28px;
}

.item-ai-chat__mic-img {
  display: block;
  width: 28px;
  height: 28px;
  object-fit: contain;
  pointer-events: none;
}

.item-ai-chat__close {
  width: 24px;
  height: 24px;

  img {
    display: block;
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
}

/* Dot Grid（第二行文案叠在其上方偏左） */
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

/* Group 21 */
.item-ai-chat__bubble-wrap {
  position: absolute;
  left: 118px;
  top: 536px;
  width: 253px;
  height: 68px;
  z-index: 2;
}

.item-ai-chat__bubble {
  position: absolute;
  left: 0;
  top: 0;
  width: 253px;
  height: 68px;
  object-fit: fill;
  transform: scaleX(-1);
  pointer-events: none;
}

/* Rectangle 37 */
.item-ai-chat__bubble-fill {
  position: absolute;
  left: 53px;
  top: 13px;
  width: 185px;
  height: 38px;
  background: #ffffff;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 8px;
  box-sizing: border-box;
}

.item-ai-chat__bubble-text {
  margin: 0;
  width: 100%;
  font-family: $item-ai-font;
  font-size: 13px;
  line-height: 1.25;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* image 4 */
.item-ai-chat__bubble-avatar {
  position: absolute;
  left: 209px;
  top: 17px;
  width: 29px;
  height: 29px;
  object-fit: cover;
  border-radius: 4px;
  pointer-events: none;
}

/* 06c6b77… 相册 */
.item-ai-chat__gallery-hit {
  position: absolute;
  left: 0;
  top: 769px;
  width: 85px;
  height: 75px;
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
    width: 85px;
    height: 75px;
    object-fit: contain;
    pointer-events: none;
  }
}

/* Group 19 / Vector 14 + 发消息 */
.item-ai-chat__input-wrap {
  position: absolute;
  left: 85px;
  top: 785px;
  width: 209px;
  height: 43px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 209px 43px;
  box-sizing: border-box;
}

.item-ai-chat__input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 11px 10px 10px 6px;
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
  left: 305px;
  top: 786px;
  width: 67px;
  height: 42px;
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
    width: 67px;
    height: 42px;
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
</style>
