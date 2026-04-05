<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PoemSwitch from '@/components/PoemSwitch.vue'
import { useItemStore } from '@/stores/item'
import imgClose from '@/assets/figma/item-ai/icon-close.png'
import imgDotGrid from '@/assets/figma/item-ai/dot-grid.png'
import imgAvatar from '@/assets/figma/item-ai/avatar.png'
import imgChatItemFallback from '@/assets/figma/item-ai/chat-item-reference.png'
import imgPoemPanelBg from '@/assets/figma/item-card/poem-panel-bg.svg'

/** 待接 API 的占位数据 */
const MOCK_OWNER_COUNT = 128
const MOCK_POEM_OWN =
  '旧时光在掌心发潮，你把它举过眉间，像举起一小片耐心的海。'
const MOCK_POEM_OTHER =
  '有人用树脂封住盛夏，有人用沉默给座位编号——我们都在等同一声铃响。'

const router = useRouter()
const itemStore = useItemStore()
const {
  pendingCaptureObjectUrl,
  draftItemTitle,
  draftStoryText,
  draftGalleryObjectUrls,
} = storeToRefs(itemStore)

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const bodyPrevOverflow = ref('')

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

const heroSrc = computed(() => pendingCaptureObjectUrl.value ?? imgChatItemFallback)
const hasStory = computed(() => draftStoryText.value.trim().length > 0)
const hasGallery = computed(() => draftGalleryObjectUrls.value.length > 0)

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

function onRegeneratePoem() {
  // 预留：接入 AI 换一版诗句
  console.info('[ItemCard] regenerate poem (stub)')
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
  <div ref="rootRef" class="item-card">
    <div ref="frameRef" class="item-card__frame">
      <div class="item-card__stage">
        <div
          class="item-card__dot-grid"
          :style="{ backgroundImage: `url(${imgDotGrid})` }"
          aria-hidden="true"
        />

        <button type="button" class="item-card__close" aria-label="返回" @click="onClose">
          <img :src="imgClose" alt="" width="24" height="24" >
        </button>

        <div class="item-card__hero-wrap">
          <img :src="heroSrc" alt="" class="item-card__hero" draggable="false" >
        </div>

        <h1 class="item-card__title">
          {{ draftItemTitle }}
        </h1>

        <div v-if="hasGallery" class="item-card__gallery">
          <img
            v-for="(src, i) in draftGalleryObjectUrls"
            :key="`${src}-${i}`"
            :src="src"
            alt=""
            class="item-card__gallery-thumb"
            draggable="false"
          >
        </div>

        <section v-if="hasStory" class="item-card__story">
          <h2 class="item-card__section-label">
            我的故事
          </h2>
          <p class="item-card__story-body">
            {{ draftStoryText }}
          </p>
        </section>

        <section class="item-card__poem-block">
          <div
            class="item-card__poem-panel"
            :style="{ backgroundImage: `url(${imgPoemPanelBg})` }"
          >
            <div class="item-card__poem-head">
              <img :src="imgAvatar" alt="" class="item-card__avatar" width="40" height="40" >
              <div class="item-card__poem-head-text">
                <span class="item-card__poem-label">AI 诗句</span>
                <button
                  type="button"
                  class="item-card__regen"
                  aria-label="换一版诗句"
                  @click="onRegeneratePoem"
                >
                  换一版
                </button>
              </div>
            </div>
            <PoemSwitch
              class="item-card__poem-switch"
              :own-poem="MOCK_POEM_OWN"
              :other-poem="MOCK_POEM_OTHER"
            />
          </div>
        </section>

        <p class="item-card__owners" aria-live="polite">
          <span class="item-card__owners-count">{{ MOCK_OWNER_COUNT }}</span>
          人拥有同款物件
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$item-card-font: var(--font-family-app);
$item-card-purple: #8470ff;
$item-card-muted: #6e6e6e;

.item-card {
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

.item-card__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  background: #ffffff;
  transform-origin: center center;
}

.item-card__stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  box-sizing: border-box;
  padding: 56px 24px 32px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.item-card__dot-grid {
  position: absolute;
  left: 25px;
  top: 420px;
  width: 340px;
  height: 330px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 340px 340px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}

.item-card__close {
  position: absolute;
  left: 24px;
  top: 16px;
  z-index: 3;
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

  img {
    display: block;
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
}

.item-card__hero-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.item-card__hero {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.item-card__title {
  position: relative;
  z-index: 1;
  margin: 0 0 20px;
  font-family: $item-card-font;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  color: #000;
}

.item-card__gallery {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-bottom: 16px;
  padding-bottom: 4px;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }
}

.item-card__gallery-thumb {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(132, 112, 255, 0.25);
}

.item-card__story {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.item-card__section-label {
  margin: 0 0 8px;
  font-family: $item-card-font;
  font-size: 14px;
  font-weight: 600;
  color: $item-card-muted;
}

.item-card__story-body {
  margin: 0;
  font-family: $item-card-font;
  font-size: 15px;
  line-height: 1.55;
  color: #333;
  white-space: pre-wrap;
}

.item-card__poem-block {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.item-card__poem-panel {
  padding: 16px 16px 18px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 100% 100%;
  box-sizing: border-box;
  min-height: 168px;
}

.item-card__poem-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-card__avatar {
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.item-card__poem-head-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.item-card__poem-label {
  font-family: $item-card-font;
  font-size: 13px;
  font-weight: 600;
  color: $item-card-purple;
}

.item-card__regen {
  margin: 0;
  padding: 4px 0;
  border: none;
  background: transparent;
  font-family: $item-card-font;
  font-size: 13px;
  font-weight: 600;
  color: $item-card-purple;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.item-card__poem-switch {
  position: relative;
  z-index: 1;
}

.item-card__owners {
  position: relative;
  z-index: 1;
  margin: 0;
  text-align: center;
  font-family: $item-card-font;
  font-size: 15px;
  line-height: 1.4;
  color: #444;
}

.item-card__owners-count {
  font-weight: 700;
  color: $item-card-purple;
}
</style>
