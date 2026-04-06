<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { AVATAR_CELLS } from '@/domain/avatarPresets'
import refImg from '@/assets/figma/onboarding-avatar/reference.png'
import imgDoneBtn from '@/assets/item-card-gen/btn-done.png'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

/** 从「我的小宝贝们」进入：同布局，底部 Done，回目录并更新头像 */
const isChangeAvatarFlow = computed(() => route.name === 'carrier-directory-avatar')

/** 矢量「下一步」图形在稿中的区域（node 150:1607） */
const NEXT_SPRITE = { x: 144, y: 679, w: 87, h: 86 }

const FRAME_W = 390
const FRAME_H = 844

const selectedId = ref<string | null>(null)

const canContinue = computed(() => selectedId.value != null)

/** 标题雪碧在稿中宽 73×22，左→右切段（仅用于裁剪，不改变字体图形） */
const TITLE_SPRITE = { left: 164, top: 187, fullW: 73, h: 22 }
const TITLE_SEGMENTS = [
  { w: 18, off: 0 },
  { w: 17, off: 18 },
  { w: 18, off: 35 },
  { w: 20, off: 53 },
] as const

const titleRevealCount = ref(0)
let titleRevealTimer: ReturnType<typeof setInterval> | undefined

function titleSegmentInnerStyle(off: number) {
  return {
    display: 'block',
    width: `${TITLE_SPRITE.fullW}px`,
    height: `${TITLE_SPRITE.h}px`,
    backgroundImage: `url(${refImg})`,
    backgroundSize: `${FRAME_W}px ${FRAME_H}px`,
    backgroundPosition: `-${TITLE_SPRITE.left}px -${TITLE_SPRITE.top}px`,
    transform: `translateX(-${off}px)`,
  }
}

const nextStyle = computed(() => ({
  backgroundImage: `url(${refImg})`,
  backgroundSize: `${FRAME_W}px ${FRAME_H}px`,
  backgroundPosition: `-${NEXT_SPRITE.x}px -${NEXT_SPRITE.y}px`,
  width: `${NEXT_SPRITE.w}px`,
  height: `${NEXT_SPRITE.h}px`,
}))

function select(id: string) {
  selectedId.value = id
}

function continueNext() {
  if (!selectedId.value) return
  user.avatarPresetId = selectedId.value
  if (isChangeAvatarFlow.value) {
    void router.push({ name: 'carrier-directory' })
  } else {
    void router.push({ name: 'onboarding-carrier' })
  }
}

const bodyPrevOverflow = ref('')
const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

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

/** 单屏固定：禁止底层页面滚动；微信 web-view 首帧滚动异常时回到顶部 */
onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  void nextTick().then(() => {
    updateFrameScale()
  })
  window.addEventListener('resize', updateFrameScale)

  if (isChangeAvatarFlow.value && user.avatarPresetId) {
    selectedId.value = user.avatarPresetId
  }

  const stepMs = 160
  const startDelayMs = 280
  window.setTimeout(() => {
    titleRevealCount.value = 1
    titleRevealTimer = window.setInterval(() => {
      if (titleRevealCount.value < TITLE_SEGMENTS.length) {
        titleRevealCount.value += 1
      } else if (titleRevealTimer != null) {
        clearInterval(titleRevealTimer)
        titleRevealTimer = undefined
      }
    }, stepMs)
  }, startDelayMs)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFrameScale)
  if (titleRevealTimer != null) clearInterval(titleRevealTimer)
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div ref="rootRef" class="onboarding-avatar">
    <div ref="frameRef" class="onboarding-avatar__frame">
      <main class="onboarding-avatar__main">
        <div class="onboarding-avatar__title-wrap">
          <h1 class="onboarding-avatar__title" aria-label="你是谁？">
            <span class="onboarding-avatar__title-track" aria-hidden="true">
              <span
                v-for="(seg, i) in TITLE_SEGMENTS"
                :key="i"
                class="onboarding-avatar__title-char"
                :class="{ 'onboarding-avatar__title-char--open': titleRevealCount > i }"
                :style="{ '--char-w': `${seg.w}px` }"
              >
                <span class="onboarding-avatar__title-char-inner" :style="titleSegmentInnerStyle(seg.off)" />
              </span>
            </span>
          </h1>
        </div>

        <div
          class="onboarding-avatar__grid"
          role="listbox"
          aria-label="选择预制头像"
        >
          <button
            v-for="cell in AVATAR_CELLS"
            :key="cell.id"
            type="button"
            class="onboarding-avatar__cell"
            :class="{
              'onboarding-avatar__cell--dimmed':
                selectedId != null && selectedId !== cell.id,
            }"
            :aria-selected="selectedId === cell.id"
            role="option"
            @click="select(cell.id)"
          >
            <img
              :src="cell.src"
              alt=""
              class="onboarding-avatar__cell-img"
              draggable="false"
            >
          </button>
        </div>

        <div class="onboarding-avatar__footer">
          <button
            v-if="isChangeAvatarFlow"
            type="button"
            class="onboarding-avatar__done"
            :disabled="!canContinue"
            aria-label="完成"
            @click="continueNext"
          >
            <img :src="imgDoneBtn" alt="" class="onboarding-avatar__done-img" draggable="false" >
          </button>
          <button
            v-else
            type="button"
            class="onboarding-avatar__next"
            :disabled="!canContinue"
            aria-label="下一步"
            @click="continueNext"
          >
            <span class="onboarding-avatar__next-sprite" :style="nextStyle" />
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 单屏 Figma Frame 390×844，相对视口固定居中，窄屏/矮屏整体等比缩小 */
.onboarding-avatar {
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

.onboarding-avatar__frame {
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  box-sizing: border-box;
  background: #fff;
  display: flex;
  flex-direction: column;
  transform-origin: center center;
  /* scale 由脚本写入，避免 postcss 破坏 calc(min(...)) 与部分 WebView 对 CSS min() 的兼容问题 */
}

/* 稿中标题距 Frame 顶约 187px（新稿无顶栏） */
.onboarding-avatar__main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 187px;
}

.onboarding-avatar__title-wrap {
  margin-bottom: 36px;
}

.onboarding-avatar__title {
  margin: 0;
  font: inherit;
  line-height: 0;
}

.onboarding-avatar__title-track {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-start;
  height: 22px;
}

.onboarding-avatar__title-char {
  display: block;
  overflow: hidden;
  flex-shrink: 0;
  width: 0;
  height: 22px;
  transition: width 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  image-rendering: -webkit-optimize-contrast;
}

.onboarding-avatar__title-char--open {
  width: var(--char-w);
}

.onboarding-avatar__title-char-inner {
  background-repeat: no-repeat;
  will-change: transform;
}

.onboarding-avatar__grid {
  display: grid;
  grid-template-columns: repeat(3, 90px);
  grid-template-rows: repeat(3, 90px);
  gap: 36px 30px;
  justify-content: center;
  width: 100%;
  padding: 0 29px;
  box-sizing: border-box;
}

.onboarding-avatar__cell {
  width: 90px;
  height: 90px;
  padding: 0;
  border: none;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease, opacity 0.15s ease;

  &--dimmed {
    opacity: 0.4;
  }

  &:active {
    transform: scale(0.96);
  }
}

.onboarding-avatar__cell-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.onboarding-avatar__footer {
  margin-top: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 底部留白 + 安全区只算一次，避免贴 Home 条 */
  padding: 32px 0 calc(36px + env(safe-area-inset-bottom, 0px));
  width: 100%;
}

.onboarding-avatar__next {
  min-width: 120px;
  min-height: 120px;
  padding: 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:not(:disabled):active .onboarding-avatar__next-sprite {
    transform: scale(0.95);
  }
}

.onboarding-avatar__next-sprite {
  display: block;
  background-repeat: no-repeat;
  image-rendering: -webkit-optimize-contrast;
  transition: transform 0.1s ease;
}

.onboarding-avatar__done {
  margin: 0;
  padding: 16px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:not(:disabled):active .onboarding-avatar__done-img {
    transform: scale(0.96);
  }
}

.onboarding-avatar__done-img {
  display: block;
  width: min(60px, 21.6vw);
  height: auto;
  object-fit: contain;
  transition: transform 0.1s ease;
}
</style>
