<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'

import imgDotGrid from '@card-assets/1.png'
import imgPaper from '@card-assets/Group 23.png'
import imgStar from '@card-assets/Group 4.png'
import imgVoice from '@card-assets/Group 5.png'
import imgThumbsUp from '@card-assets/thumbs-up.png'
import imgRepeat from '@card-assets/repeat.png'
import imgCreate from '@card-assets/create.png'
import imgChevron from '@card-assets/chevron-down.png'
import imgScene from '@card-assets/IMG_0344 1.png'
import imgDoneBtn from '@card-assets/06c6b77eb266168b280559ed5f25fec3 1.png'

/** 参考稿社交文案人数 */
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

const router = useRouter()
const itemStore = useItemStore()
const { pendingCaptureObjectUrl, draftItemTitle, draftStoryText, draftGalleryObjectUrls } =
  storeToRefs(itemStore)

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const bodyPrevOverflow = ref('')

const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

const displayStory = computed(() => {
  const t = draftStoryText.value.trim()
  if (t) return t
  return DEFAULT_STORY_LINES.join('\n')
})

const scenePhotoSrc = computed(() => draftGalleryObjectUrls.value[0] ?? imgScene)

const heroSrc = computed(() => pendingCaptureObjectUrl.value)

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

function onPrimaryDone() {
  router.push({ name: 'carrier-list' })
}

function onIconLike() {
  console.info('[ItemCard] like')
}

function onIconRepeat() {
  console.info('[ItemCard] repeat')
}

function onIconEdit() {
  console.info('[ItemCard] edit')
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
  <div ref="rootRef" class="item-card-gen">
    <div ref="frameRef" class="item-card-gen__frame">
      <div
        class="item-card-gen__stage"
        :style="{ backgroundImage: `url(${imgDotGrid})` }"
      >
        <div class="item-card-gen__scroll">
          <div class="item-card-gen__paper-wrap">
            <img :src="imgPaper" alt="" class="item-card-gen__paper-img" draggable="false" >
            <div class="item-card-gen__paper-overlay">
              <p class="item-card-gen__paper-title">
                「{{ draftItemTitle }}」
              </p>
              <p class="item-card-gen__paper-body">
                {{ displayStory }}
              </p>
            </div>
          </div>

          <div class="item-card-gen__actions" role="toolbar" aria-label="卡片操作">
            <button type="button" class="item-card-gen__icon-btn" aria-label="喜欢" @click="onIconLike">
              <img :src="imgThumbsUp" alt="" width="28" height="28" >
            </button>
            <button type="button" class="item-card-gen__icon-btn" aria-label="再发一版" @click="onIconRepeat">
              <img :src="imgRepeat" alt="" width="28" height="28" >
            </button>
            <button type="button" class="item-card-gen__icon-btn" aria-label="编辑" @click="onIconEdit">
              <img :src="imgCreate" alt="" width="28" height="28" >
            </button>
          </div>

          <div class="item-card-gen__social">
            <img :src="imgStar" alt="" class="item-card-gen__star" width="56" height="56" >
            <p class="item-card-gen__social-line item-card-gen__social-line--a">
              有{{ SOCIAL_FRIEND_COUNT }}个朋友和你有相同的品味！
            </p>
            <p class="item-card-gen__social-line item-card-gen__social-line--b">
              去搜索看看别人的故事
            </p>
            <img :src="imgChevron" alt="" class="item-card-gen__chevron" width="20" height="20" >
          </div>

          <div v-if="heroSrc" class="item-card-gen__product-wrap">
            <img :src="heroSrc" alt="" class="item-card-gen__product" draggable="false" >
          </div>

          <div class="item-card-gen__voice-wrap">
            <img :src="imgVoice" alt="" class="item-card-gen__voice" draggable="false" >
          </div>

          <div class="item-card-gen__scene-wrap">
            <img :src="scenePhotoSrc" alt="" class="item-card-gen__scene" draggable="false" >
          </div>

          <div class="item-card-gen__footer">
            <button type="button" class="item-card-gen__done-hit" aria-label="完成" @click="onPrimaryDone">
              <img :src="imgDoneBtn" alt="" class="item-card-gen__done-img" draggable="false" >
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$item-gen-purple: #8b7dff;
$item-gen-paper-ink: #9a8b7e;
$item-gen-paper-fill: #faf8f5;

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
  overflow: hidden;
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
  background-color: #fff;
  background-repeat: repeat;
  background-size: 120px 120px;
  background-position: center top;
  overflow: hidden;
}

.item-card-gen__scroll {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 20px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.item-card-gen__paper-wrap {
  position: relative;
  width: 100%;
  max-width: 318px;
  margin: 0 auto 10px;
  filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.06));
}

.item-card-gen__paper-img {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  pointer-events: none;
  user-select: none;
}

.item-card-gen__paper-overlay {
  position: absolute;
  left: 11%;
  right: 11%;
  top: 26%;
  bottom: 18%;
  box-sizing: border-box;
  padding: 10px 12px 14px;
  background: rgba($item-gen-paper-fill, 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.item-card-gen__paper-title {
  margin: 0 0 10px;
  font-family: var(--font-family-app);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  color: $item-gen-paper-ink;
}

.item-card-gen__paper-body {
  margin: 0;
  font-family: var(--font-family-app);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.65;
  color: $item-gen-paper-ink;
  white-space: pre-wrap;
}

.item-card-gen__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 44px;
  margin-bottom: 18px;
}

.item-card-gen__icon-btn {
  margin: 0;
  padding: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  border-radius: 12px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.72;
  }

  img {
    display: block;
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
}

.item-card-gen__social {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
  max-width: 300px;
}

.item-card-gen__star {
  display: block;
  width: 56px;
  height: auto;
  object-fit: contain;
  margin-bottom: 4px;
}

.item-card-gen__social-line {
  margin: 0;
  text-align: center;
  font-size: 15px;
  line-height: 1.5;
  color: $item-gen-purple;
  font-family: 'KaiTi', 'STKaiti', 'BiauKai', 'PingFang SC', var(--font-family-app);
  letter-spacing: 0.02em;
}

.item-card-gen__social-line--b {
  font-size: 14px;
}

.item-card-gen__chevron {
  display: block;
  margin-top: 4px;
  opacity: 0.9;
}

.item-card-gen__product-wrap {
  width: 100%;
  max-width: 200px;
  margin: 0 auto 14px;
  display: flex;
  justify-content: center;
}

.item-card-gen__product {
  max-width: 100%;
  max-height: 220px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.item-card-gen__voice-wrap {
  width: 100%;
  max-width: 320px;
  margin: 0 auto 14px;
  display: flex;
  justify-content: center;
}

.item-card-gen__voice {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  object-fit: contain;
}

.item-card-gen__scene-wrap {
  width: 100%;
  max-width: 300px;
  margin: 0 auto 20px;
  border-radius: 14px;
  overflow: hidden;
  line-height: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.item-card-gen__scene {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  object-fit: cover;
}

.item-card-gen__footer {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 4px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
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

.item-card-gen__done-img {
  display: block;
  width: min(300px, 86vw);
  max-width: 320px;
  height: auto;
  object-fit: contain;
}
</style>
