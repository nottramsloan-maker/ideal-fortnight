<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarrierStore } from '@/stores/carrier'
import img10 from '@/assets/figma/onboarding-carrier/image-10.png'
import img11 from '@/assets/figma/onboarding-carrier/image-11.png'
import img12 from '@/assets/figma/onboarding-carrier/image-12.png'
import imgBox from '@/assets/figma/onboarding-carrier/image-box.png'
import imgMonitor from '@/assets/figma/onboarding-carrier/image-monitor.png'
import refImg from '@/assets/figma/onboarding-avatar/reference.png'

const router = useRouter()
const carrierStore = useCarrierStore()

/** 顺序：首屏只见前三项（冰箱、房间、书架），纸箱与显示器需横向滑动 */
type CarrierPickKey = 'fridge' | 'room' | 'bookshelf' | 'box' | 'monitor'

const CARRIERS: { key: CarrierPickKey; label: string; src: string }[] = [
  { key: 'fridge', label: '冰箱', src: img11 },
  { key: 'room', label: '房间', src: img10 },
  { key: 'bookshelf', label: '书架', src: img12 },
  { key: 'box', label: '纸箱', src: imgBox },
  { key: 'monitor', label: '显示器', src: imgMonitor },
]

/** 默认居中「房间」 */
const selectedKey = ref<CarrierPickKey>('room')

const canContinue = computed(() => selectedKey.value != null)

/** 与头像页同稿：「下一步」雪碧区域（node 150:1607） */
const FRAME_W = 390
const FRAME_H = 844
const NEXT_SPRITE = { x: 144, y: 679, w: 87, h: 86 }

const nextStyle = computed(() => ({
  backgroundImage: `url(${refImg})`,
  backgroundSize: `${FRAME_W}px ${FRAME_H}px`,
  backgroundPosition: `-${NEXT_SPRITE.x}px -${NEXT_SPRITE.y}px`,
  width: `${NEXT_SPRITE.w}px`,
  height: `${NEXT_SPRITE.h}px`,
}))

const titleText = '你想把东西放在哪？'
const titleChars = Array.from(titleText)
const titleRevealCount = ref(0)
let titleRevealTimer: ReturnType<typeof setInterval> | undefined

function continueNext() {
  if (!selectedKey.value) return
  carrierStore.onboardingTemplateKey = selectedKey.value
  /** 「房间」走拍照第一件物品；其余载体进入与物品清单同构的物件 list（顶图为所选载体） */
  if (selectedKey.value === 'room') {
    router.push({ name: 'onboarding-first-item' })
  } else {
    carrierStore.addDirectoryCarrierIfNew(selectedKey.value)
    router.push({
      name: 'carrier-item-feed',
      query: { carrier: selectedKey.value },
    })
  }
}

const bodyPrevOverflow = ref('')
const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)

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

const SLIDE_SELECTOR = '.onboarding-carrier__carousel-slide'

function getSlideEls(): HTMLElement[] {
  const v = viewportRef.value
  if (!v) return []
  return [...v.querySelectorAll<HTMLElement>(SLIDE_SELECTOR)]
}

/** 将第 i 项滚到视口水平正中 */
function scrollToIndex(i: number, behavior: ScrollBehavior = 'auto') {
  const v = viewportRef.value
  const slides = getSlideEls()
  const slide = slides[i]
  if (!v || !slide) return
  const left = slide.offsetLeft - v.clientWidth / 2 + slide.clientWidth / 2
  v.scrollTo({ left: Math.max(0, left), behavior })
}

/** 视口中心距哪一项最近，即为选中 */
function updateCenterSelection() {
  const v = viewportRef.value
  const slides = getSlideEls()
  if (!v || slides.length === 0) return
  const vx = v.getBoundingClientRect()
  const mid = vx.left + vx.width / 2
  let best = 0
  let bestD = Infinity
  slides.forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const c = r.left + r.width / 2
    const d = Math.abs(c - mid)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  selectedKey.value = CARRIERS[best]!.key
}

let scrollRaf = 0
function onCarouselScroll() {
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    updateCenterSelection()
  })
}

function onSlideClick(i: number) {
  scrollToIndex(i, 'smooth')
}

function syncScrollToSelection() {
  const i = CARRIERS.findIndex((c) => c.key === selectedKey.value)
  if (i >= 0) scrollToIndex(i, 'auto')
}

function onWindowResize() {
  updateFrameScale()
  void nextTick().then(() => syncScrollToSelection())
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  void nextTick().then(() => {
    updateFrameScale()
    void nextTick().then(() => {
      const roomIdx = CARRIERS.findIndex((c) => c.key === 'room')
      scrollToIndex(roomIdx >= 0 ? roomIdx : 1, 'auto')
      updateCenterSelection()
    })
  })
  window.addEventListener('resize', onWindowResize)

  const stepMs = 160
  const startDelayMs = 280
  window.setTimeout(() => {
    titleRevealCount.value = 1
    titleRevealTimer = window.setInterval(() => {
      if (titleRevealCount.value < titleChars.length) {
        titleRevealCount.value += 1
      } else if (titleRevealTimer != null) {
        clearInterval(titleRevealTimer)
        titleRevealTimer = undefined
      }
    }, stepMs)
  }, startDelayMs)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  if (titleRevealTimer != null) clearInterval(titleRevealTimer)
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div ref="rootRef" class="onboarding-carrier">
    <div ref="frameRef" class="onboarding-carrier__frame">
      <div class="onboarding-carrier__stage">
        <div class="onboarding-carrier__carousel">
          <div
            ref="viewportRef"
            class="onboarding-carrier__carousel-viewport"
            @scroll.passive="onCarouselScroll"
            @scrollend="updateCenterSelection"
          >
            <div class="onboarding-carrier__carousel-track">
              <button
                v-for="(item, i) in CARRIERS"
                :key="item.key"
                type="button"
                class="onboarding-carrier__pick onboarding-carrier__carousel-slide"
                :class="{ 'onboarding-carrier__pick--dimmed': selectedKey !== item.key }"
                :aria-pressed="selectedKey === item.key"
                :aria-label="item.label"
                @click="onSlideClick(i)"
              >
                <img :src="item.src" alt="" class="onboarding-carrier__pick-img" >
              </button>
            </div>
          </div>
        </div>

        <h1 class="onboarding-carrier__title" :aria-label="titleText">
          <span
            v-for="(ch, i) in titleChars"
            :key="i"
            class="onboarding-carrier__title-char"
            :class="{ 'onboarding-carrier__title-char--show': titleRevealCount > i }"
          >{{ ch }}</span>
        </h1>

        <div class="onboarding-carrier__footer">
          <button
            type="button"
            class="onboarding-carrier__next"
            :disabled="!canContinue"
            aria-label="下一步"
            @click="continueNext"
          >
            <span class="onboarding-carrier__next-sprite" :style="nextStyle" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 视口宽 390，一屏恰好 3 个槽位 */
$viewport-w: 390px;
$slide-w: calc(#{$viewport-w} / 3);
$track-pad-x: calc((#{$viewport-w} - #{$slide-w}) / 2);
$slide-gap: 12px;

.onboarding-carrier {
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

.onboarding-carrier__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  box-sizing: border-box;
  background: #fff;
  transform-origin: center center;
}

.onboarding-carrier__stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
}

.onboarding-carrier__carousel {
  position: absolute;
  left: 0;
  right: 0;
  top: 336px;
  height: 140px;
}

.onboarding-carrier__carousel-viewport {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.onboarding-carrier__carousel-track {
  display: flex;
  align-items: center;
  gap: $slide-gap;
  padding: 0 $track-pad-x;
  height: 100%;
  box-sizing: border-box;
}

.onboarding-carrier__carousel-slide {
  flex: 0 0 $slide-w;
  width: $slide-w;
  height: 124px;
  scroll-snap-align: center;
}

.onboarding-carrier__pick {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.onboarding-carrier__pick-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.onboarding-carrier__pick--dimmed .onboarding-carrier__pick-img {
  opacity: 0.4;
}

.onboarding-carrier__pick:not(.onboarding-carrier__pick--dimmed) .onboarding-carrier__pick-img {
  opacity: 1;
}

/* 你想把东西放在哪？ */
.onboarding-carrier__title {
  position: absolute;
  left: 126px;
  top: 468px;
  width: 163px;
  min-height: 67px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-end;
  align-items: flex-end;
  justify-content: center;
  text-align: center;
  font-family: var(--font-family-app);
  font-size: 18.0556px;
  line-height: 25px;
  font-weight: 400;
  color: #000;
}

.onboarding-carrier__title-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.22s ease-out,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.onboarding-carrier__title-char--show {
  opacity: 1;
  transform: translateY(0);
}

/* 与 OnboardingAvatar 底部「下一步」同布局与样式 */
.onboarding-carrier__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 calc(36px + env(safe-area-inset-bottom, 0px));
  width: 100%;
  box-sizing: border-box;
}

.onboarding-carrier__next {
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

  &:not(:disabled):active .onboarding-carrier__next-sprite {
    transform: scale(0.95);
  }
}

.onboarding-carrier__next-sprite {
  display: block;
  background-repeat: no-repeat;
  image-rendering: -webkit-optimize-contrast;
  transition: transform 0.1s ease;
}
</style>
