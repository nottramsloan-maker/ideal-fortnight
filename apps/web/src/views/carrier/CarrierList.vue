<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import imgDotTile from '@/assets/item-card-gen/dot-tile.png'
import CarrierListRowIcon from './CarrierListRowIcon.vue'

const LIST_PURPLE = '#8b7dff'

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

type IconCell = { imageUrl?: string | null; stamp?: string }
type ListSection = { title: string; date: string; icons: IconCell[] }

/** 与参考稿「Stuff」清单结构一致；文案中文化 */
const DEMO_SECTIONS: ListSection[] = [
  { title: '园艺', date: '2011.08.03', icons: [{ stamp: 'bottle' }] },
  {
    title: '园艺',
    date: '2011.06.03',
    icons: [
      { stamp: 'lantern' },
      { stamp: 'trowel' },
      { stamp: 'fork' },
      { stamp: 'pot' },
      { stamp: 'can' },
    ],
  },
  {
    title: '家具 04',
    date: '2011.04.29',
    icons: [{ stamp: 'chair' }, { stamp: 'clock' }, { stamp: 'cage' }],
  },
  {
    title: '穿搭 07',
    date: '2012.01.16',
    icons: [{ stamp: 'bag' }, { stamp: 'bag' }, { stamp: 'bag' }, { stamp: 'bag' }],
  },
  {
    title: '厨具 09',
    date: '2012.01.07',
    icons: [{ stamp: 'plate' }, { stamp: 'cutlery' }, { stamp: 'mitt' }, { stamp: 'pan' }],
  },
  {
    title: '厨具 08',
    date: '2012.01.05',
    icons: [{ stamp: 'mug' }, { stamp: 'casserole' }, { stamp: 'bowl' }, { stamp: 'teapot' }],
  },
  {
    title: '雨季',
    date: '2011.05.30',
    icons: [
      { stamp: 'raincoat' },
      { stamp: 'umbrella' },
      { stamp: 'umbrella-open' },
      { stamp: 'teru' },
    ],
  },
]

const router = useRouter()
const itemStore = useItemStore()
const { pendingCaptureObjectUrl, draftItemTitle } = storeToRefs(itemStore)

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const bodyPrevOverflow = ref('')

function formatDotDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

const userSection = computed<ListSection | null>(() => {
  const url = pendingCaptureObjectUrl.value
  const title = draftItemTitle.value?.trim()
  if (!url && !title) return null
  return {
    title: title || '新物品',
    date: formatDotDate(new Date()),
    icons: [{ imageUrl: url, stamp: 'bottle' }],
  }
})

const sections = computed(() => {
  const u = userSection.value
  if (u) return [u, ...DEMO_SECTIONS]
  return DEMO_SECTIONS
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

function onBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'profile' })
}

function onAddItem() {
  void router.push({ name: 'item-new' })
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  void nextTick().then(() => updateFrameScale())
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div ref="rootRef" class="carrier-list">
    <div ref="frameRef" class="carrier-list__frame">
      <div class="carrier-list__stage">
        <div class="carrier-list__bg" aria-hidden="true">
          <div
            class="carrier-list__bg-dots"
            :style="{ backgroundImage: `url(${imgDotTile})` }"
          />
        </div>

        <header class="carrier-list__nav">
          <button type="button" class="carrier-list__nav-btn" aria-label="返回" @click="onBack">
            <span class="carrier-list__chev" aria-hidden="true">&lt;</span>
          </button>
          <h1 class="carrier-list__nav-title">
            清单
          </h1>
          <div class="carrier-list__nav-right">
            <button type="button" class="carrier-list__nav-icon" aria-label="更多">
              <span class="carrier-list__dots" aria-hidden="true">···</span>
            </button>
            <button type="button" class="carrier-list__nav-icon" aria-label="记录">
              <span class="carrier-list__record" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div class="carrier-list__scroll">
          <div class="carrier-list__hero">
            <svg
              class="carrier-list__house"
              viewBox="0 0 120 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M60 12L18 48h8v38h68V48h8L60 12z"
                stroke="#0a0a0a"
                stroke-width="3"
                stroke-linejoin="round"
              />
              <path
                d="M42 86V58h36v28"
                stroke="#0a0a0a"
                stroke-width="3"
                stroke-linecap="round"
              />
              <rect x="52" y="66" width="16" height="20" stroke="#0a0a0a" stroke-width="2.5" />
              <path
                d="M72 34h14v10H72z"
                stroke="#0a0a0a"
                stroke-width="2.2"
              />
            </svg>
          </div>

          <div class="carrier-list__toolbar" role="toolbar" aria-label="快捷操作">
            <button type="button" class="carrier-list__tool-btn" aria-label="网格视图">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" :stroke="LIST_PURPLE" stroke-width="2" />
                <rect x="14" y="3" width="7" height="7" :stroke="LIST_PURPLE" stroke-width="2" />
                <rect x="3" y="14" width="7" height="7" :stroke="LIST_PURPLE" stroke-width="2" />
                <rect x="14" y="14" width="7" height="7" :stroke="LIST_PURPLE" stroke-width="2" />
              </svg>
            </button>
            <button type="button" class="carrier-list__tool-btn" aria-label="添加" @click="onAddItem">
              <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
                <circle :stroke="LIST_PURPLE" stroke-width="2" cx="12" cy="12" r="9" fill="none" />
                <path :stroke="LIST_PURPLE" stroke-width="2" stroke-linecap="round" d="M12 8v8M8 12h8" />
              </svg>
            </button>
            <button type="button" class="carrier-list__tool-btn" aria-label="分享">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  :stroke="LIST_PURPLE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                  d="M12 4v10M8 8l4-4 4 4M6 14v4a2 2 0 002 2h8a2 2 0 002-2v-4"
                />
              </svg>
            </button>
          </div>

          <section
            v-for="(block, idx) in sections"
            :key="`${block.title}-${block.date}-${idx}`"
            class="carrier-list__block"
          >
            <h2 class="carrier-list__block-title">
              {{ block.title }}
            </h2>
            <p class="carrier-list__block-date">
              {{ block.date }}
            </p>
            <div class="carrier-list__icon-row">
              <CarrierListRowIcon
                v-for="(cell, i) in block.icons"
                :key="i"
                :image-url="cell.imageUrl"
                :stamp="cell.stamp"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.carrier-list {
  position: fixed;
  inset: 0;
  z-index: 1;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f2;
  overflow: hidden;
}

.carrier-list__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  transform-origin: center center;
}

.carrier-list__stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f0f0f2;
}

.carrier-list__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #f0f0f2;
}

.carrier-list__bg-dots {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  background-position: 0 0;
  background-size: auto;
  filter: invert(1);
  opacity: 0.2;
}

.carrier-list__nav {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 6px;
  min-height: 44px;
}

.carrier-list__nav-btn {
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.65;
  }
}

.carrier-list__chev {
  font-size: 22px;
  font-weight: 500;
  color: #111;
  line-height: 1;
}

.carrier-list__nav-title {
  margin: 0;
  flex: 1;
  text-align: center;
  font-family: var(--font-family-app);
  font-size: 18px;
  font-weight: 600;
  color: #111;
  letter-spacing: 0.02em;
}

.carrier-list__nav-right {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 88px;
  justify-content: flex-end;
}

.carrier-list__nav-icon {
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.65;
  }
}

.carrier-list__dots {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  letter-spacing: 1px;
  line-height: 1;
  transform: translateY(-2px);
}

.carrier-list__record {
  width: 22px;
  height: 22px;
  border: 2.5px solid #111;
  border-radius: 50%;
  box-sizing: border-box;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    background: #111;
    border-radius: 50%;
  }
}

.carrier-list__scroll {
  position: relative;
  z-index: 1;
  height: calc(100% - 56px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 32px;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.carrier-list__hero {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.carrier-list__house {
  width: min(200px, 52vw);
  height: auto;
  display: block;
}

.carrier-list__toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 12px 0 28px;
}

.carrier-list__tool-btn {
  margin: 0;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.72;
    transform: scale(0.96);
  }
}

.carrier-list__block {
  margin-bottom: 36px;
}

.carrier-list__block-title {
  margin: 0;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #111;
}

.carrier-list__block-date {
  margin: 4px 0 14px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: #3a3a3a;
}

.carrier-list__icon-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
}
</style>
