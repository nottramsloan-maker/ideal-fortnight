<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'

/** 点阵瓦片（素材为黑底白点，CSS invert 后叠白底呈灰点） */
import imgDotTile from '@/assets/item-card-gen/dot-tile.png'
import imgDoneBtn from '@/assets/item-card-gen/btn-done.png'
import imgPaper from '@card-assets/Group 23.png'
import imgStar from '@card-assets/Group 4.png'
import imgVoice from '@card-assets/Group 5.png'
import imgThumbsUp from '@card-assets/thumbs-up.png'
import imgRepeat from '@card-assets/repeat.png'
import imgCreate from '@card-assets/create.png'
import imgChevron from '@card-assets/chevron-down.png'
import imgScene from '@card-assets/IMG_0344 1.png'

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

const router = useRouter()
const route = useRoute()
const itemStore = useItemStore()
const { pendingCaptureObjectUrl, draftItemTitle, draftStoryText, draftGalleryObjectUrls } =
  storeToRefs(itemStore)

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
const bodyPrevOverflow = ref('')

const FRAME_CSS_W = 390
const FRAME_CSS_H = PANEL_H

const paperTitle = computed(() => {
  if (isCardViewMode.value) return committedRow.value?.title?.trim() || '物品'
  return draftItemTitle.value
})

const displayStory = computed(() => {
  if (isCardViewMode.value) {
    const t = committedRow.value?.storyText?.trim()
    if (t) return t
    return DEFAULT_STORY_LINES.join('\n')
  }
  const t = draftStoryText.value.trim()
  if (t) return t
  return DEFAULT_STORY_LINES.join('\n')
})

const scenePhotoSrc = computed(() => {
  if (isCardViewMode.value) {
    return committedRow.value?.sceneImageUrl ?? imgScene
  }
  return draftGalleryObjectUrls.value[0] ?? imgScene
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
                class="item-card-gen__first-bg-dots"
                :style="{ backgroundImage: `url(${imgDotTile})` }"
              />
            </div>
            <div class="item-card-gen__panel-inner item-card-gen__panel-inner--top">
              <div class="item-card-gen__first-stack">
                <div class="item-card-gen__paper-wrap">
                  <img :src="imgPaper" alt="" class="item-card-gen__paper-img" draggable="false" >
                  <div class="item-card-gen__paper-overlay">
                    <p class="item-card-gen__paper-title">
                      「{{ paperTitle }}」
                    </p>
                    <p class="item-card-gen__paper-body">
                      {{ displayStory }}
                    </p>
                  </div>
                </div>

                <div
                  class="item-card-gen__actions"
                  :class="{ 'item-card-gen__actions--solo': isCardViewMode }"
                  role="toolbar"
                  aria-label="卡片操作"
                >
                  <template v-if="!isCardViewMode">
                    <button type="button" class="item-card-gen__icon-btn" aria-label="喜欢" @click="onIconLike">
                      <img :src="imgThumbsUp" alt="" width="34" height="34" >
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
                    aria-label="再发一版"
                    @click="onIconRepeat"
                  >
                    <img :src="imgRepeat" alt="" width="34" height="34" >
                  </button>
                </div>

                <img :src="imgStar" alt="" class="item-card-gen__star" width="99" height="99" >
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
          </section>

          <!-- 下屏 -->
          <section class="item-card-gen__panel item-card-gen__panel--snap item-card-gen__panel--second">
            <div class="item-card-gen__second-bg" aria-hidden="true">
              <div
                class="item-card-gen__second-bg-dots"
                :style="{ backgroundImage: `url(${imgDotTile})` }"
              />
            </div>
            <div
              class="item-card-gen__panel-inner item-card-gen__panel-inner--bottom"
              :class="{ 'item-card-gen__panel-inner--bottom--view': isCardViewMode }"
            >
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
                  <img
                    :src="imgDoneBtn"
                    alt=""
                    class="item-card-gen__done-img"
                    :class="{ 'item-card-gen__done-img--view': isCardViewMode }"
                    draggable="false"
                  >
                </button>
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
$item-gen-paper-fill: #faf8f5;
$item-gen-social-ink: #2c2c2c;

/* 第一屏主内容区（撕纸～下箭头）相对设计稿等比 1.3；点阵背景不缩放 */
$first-ui-scale: 1.3;

/* 第二屏：语音条等宽约屏宽 80%；场景照 = 语音基准×0.8×0.8；Done = 半稿×1.5×0.8×0.8；均水平居中 */
$second-wide-max: 312px;
$second-photo-done-scale: 0.8;
$second-scene-max: $second-wide-max * 0.8 * $second-photo-done-scale;
$second-bottle-max-w: 132px;
$second-bottle-max-h: 170px;
$second-scene-radius: 26px * $second-photo-done-scale;
$second-done-btn-scale: 0.8;
$second-done-w: 108px * 1.5 * $second-photo-done-scale * $second-done-btn-scale;
/* 场景图 + 下方 Done 相对语音条整体下移 */
$second-scene-block-offset-y: 15px;

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
  background: #fff;
  overflow: hidden;
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

.item-card-gen__first-bg-dots {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  background-position: 0 0;
  background-size: auto;
  filter: invert(1);
  opacity: 0.22;
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

.item-card-gen__second-bg-dots {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  background-position: 0 0;
  background-size: auto;
  filter: invert(1);
  opacity: 0.22;
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
  overflow-x: hidden;
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
  margin-top: calc(44px * #{$first-ui-scale});
}

.item-card-gen__panel-inner--bottom {
  position: relative;
  z-index: 1;
  justify-content: flex-start;
  padding-top: 36px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));

  &--view {
    padding-top: 52px;
    padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));

    .item-card-gen__product-wrap {
      margin-bottom: 36px;
    }

    .item-card-gen__product {
      max-width: calc(#{$second-bottle-max-w} * 1.14);
      max-height: calc(#{$second-bottle-max-h} * 1.14);
    }

    .item-card-gen__voice-wrap {
      margin-bottom: 38px;
    }

    .item-card-gen__scene-wrap {
      margin-top: 32px;
      margin-bottom: 36px;
    }
  }
}

.item-card-gen__paper-wrap {
  position: relative;
  width: 100%;
  max-width: calc(280px * #{$first-ui-scale});
  margin: 0 auto calc(22px * #{$first-ui-scale});
  flex-shrink: 0;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.07));
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
  padding: calc(8px * #{$first-ui-scale}) calc(10px * #{$first-ui-scale})
    calc(12px * #{$first-ui-scale});
  background: rgba($item-gen-paper-fill, 0.97);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
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

.item-card-gen__paper-title {
  margin: 0 0 calc(8px * #{$first-ui-scale});
  font-family: var(--font-family-app);
  font-size: calc(14px * #{$first-ui-scale});
  font-weight: 500;
  line-height: 1.45;
  color: $item-gen-paper-ink;
}

.item-card-gen__paper-body {
  margin: 0;
  font-family: var(--font-family-app);
  font-size: calc(12px * #{$first-ui-scale});
  font-weight: 400;
  line-height: 1.68;
  color: $item-gen-paper-ink;
  white-space: pre-wrap;
}

.item-card-gen__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: calc(40px * #{$first-ui-scale});
  flex-shrink: 0;
  margin-bottom: calc(20px * #{$first-ui-scale});

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

.item-card-gen__star {
  display: block;
  width: calc(76px * #{$first-ui-scale});
  height: auto;
  object-fit: contain;
  margin-bottom: calc(10px * #{$first-ui-scale});
  flex-shrink: 0;
}

.item-card-gen__social-line {
  margin: 0;
  text-align: center;
  line-height: 1.5;
  letter-spacing: 0.04em;
}

.item-card-gen__social-line--a {
  font-size: calc(14px * #{$first-ui-scale});
  font-family: 'KaiTi', 'STKaiti', 'BiauKai', 'Ma Shan Zheng', 'PingFang SC', var(--font-family-app);
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
  font-family: 'KaiTi', 'STKaiti', 'BiauKai', 'Ma Shan Zheng', 'PingFang SC', var(--font-family-app);
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

/* 语音条 — 与场景图同宽，约屏宽 80% */
.item-card-gen__voice-wrap {
  width: 100%;
  max-width: $second-wide-max;
  margin: 0 auto 24px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.item-card-gen__voice {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* 场景照片 — 宽度为语音条基准的 0.8，水平居中 */
.item-card-gen__scene-wrap {
  width: 100%;
  max-width: $second-scene-max;
  margin-left: auto;
  margin-right: auto;
  margin-top: $second-scene-block-offset-y;
  margin-bottom: 22px;
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

.item-card-gen__footer {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
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

/* Done：半稿×1.5×0.8×0.8，在下方留白区水平垂直居中 */
.item-card-gen__done-img {
  display: block;
  width: $second-done-w;
  max-width: 100%;
  height: auto;
  margin-left: auto;
  margin-right: auto;
  object-fit: contain;

  &--view {
    width: calc(#{$second-done-w} * 0.5);
    max-width: 50%;
  }
}
</style>
