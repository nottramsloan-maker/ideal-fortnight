<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCarrierStore } from '@/stores/carrier'
import { useUserStore } from '@/stores/user'
import { avatarPresetPreviewStyle } from '@/domain/avatarPresets'
import imgDirListBg from '@card-assets/背景.png'
import imgAvatar from '@/assets/carrier-directory/avatar-beret.png'
import imgDots from '@/assets/carrier-directory/pagination-dots.png'
import imgHouse from '@/assets/carrier-directory/carrier-house.png'
import imgFridge from '@/assets/carrier-directory/carrier-fridge.png'
import imgShelf from '@/assets/carrier-directory/carrier-shelf.png'
import imgBox from '@/assets/carrier-directory/carrier-box.png'
import imgMonitor from '@/assets/carrier-directory/carrier-monitor.png'
import imgAdd from '@/assets/carrier-directory/btn-add.png'

const router = useRouter()
const carrierStore = useCarrierStore()
const userStore = useUserStore()
const { directoryCarrierKeys } = storeToRefs(carrierStore)
const { avatarPresetId } = storeToRefs(userStore)
const bodyPrevOverflow = ref('')

/** 与 .carrier-dir__avatar 最大宽度一致，用于雪碧图切片缩放 */
const AVATAR_PREVIEW_PX = 112

const directoryAvatarSpriteStyle = computed(() =>
  avatarPresetPreviewStyle(avatarPresetId.value, AVATAR_PREVIEW_PX),
)

const DIRECTORY_TILES: Record<string, { label: string; src: string }> = {
  fridge: { label: '冰箱载体', src: imgFridge },
  bookshelf: { label: '书架载体', src: imgShelf },
  box: { label: '纸箱载体', src: imgBox },
  monitor: { label: '显示器载体', src: imgMonitor },
}

const carrierTiles = computed(() =>
  directoryCarrierKeys.value
    .map((key) => {
      const meta = DIRECTORY_TILES[key]
      return meta ? { key, label: meta.label, src: meta.src } : null
    })
    .filter((x): x is NonNullable<typeof x> => x != null),
)

function openHouseList() {
  void router.push({ name: 'carrier-list' })
}

function openCarrierItemFeed(carrierKey: string) {
  void router.push({
    name: 'carrier-item-feed',
    query: { carrier: carrierKey },
  })
}

function onAddCarrier() {
  void router.push({ name: 'onboarding-carrier' })
}

function openChangeAvatar() {
  void router.push({ name: 'carrier-directory-avatar' })
}

const titleText = '看看我现在有什么~'
const titleChars = Array.from(titleText)
const titleRevealCount = ref(0)
let titleRevealTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)

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
  if (titleRevealTimer != null) clearInterval(titleRevealTimer)
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div class="carrier-dir">
    <div class="carrier-dir__scroll">
      <header class="carrier-dir__header">
        <div
          v-if="directoryAvatarSpriteStyle"
          class="carrier-dir__avatar carrier-dir__avatar--preset"
          role="img"
          aria-label="头像"
          :style="directoryAvatarSpriteStyle"
        />
        <img
          v-else
          :src="imgAvatar"
          alt=""
          class="carrier-dir__avatar"
          draggable="false"
        >
        <button
          type="button"
          class="carrier-dir__avatar-menu"
          aria-label="更换头像"
          @click="openChangeAvatar"
        >
          <img
            :src="imgDots"
            alt=""
            class="carrier-dir__pagination"
            draggable="false"
          >
        </button>
        <h1 class="carrier-dir__title" :aria-label="titleText">
          <span
            v-for="(ch, i) in titleChars"
            :key="i"
            class="carrier-dir__title-char"
            :class="{ 'carrier-dir__title-char--show': titleRevealCount > i }"
          >{{ ch }}</span>
        </h1>
      </header>

      <!-- 与房子/feed 载体清单：仅下半（网格区）铺 背景.png，结构同 carrier-list__list-surface -->
      <div class="carrier-dir__list-surface">
        <div class="carrier-dir__list-bg" aria-hidden="true">
          <div
            class="carrier-dir__list-bg-layer"
            :style="{ backgroundImage: `url(${imgDirListBg})` }"
          />
        </div>
        <div class="carrier-dir__list-inner">
          <div class="carrier-dir__grid" role="list">
            <button
              type="button"
              class="carrier-dir__tile"
              aria-label="小屋载体"
              @click="openHouseList"
            >
              <span class="carrier-dir__tile-scale">
                <img :src="imgHouse" alt="" class="carrier-dir__tile-img" draggable="false" >
              </span>
            </button>
            <button
              v-for="tile in carrierTiles"
              :key="tile.key"
              type="button"
              class="carrier-dir__tile"
              :aria-label="tile.label"
              @click="openCarrierItemFeed(tile.key)"
            >
              <span class="carrier-dir__tile-scale">
                <img :src="tile.src" alt="" class="carrier-dir__tile-img" draggable="false" >
              </span>
            </button>
            <button
              type="button"
              class="carrier-dir__tile carrier-dir__tile--add"
              aria-label="添加载体"
              @click="onAddCarrier"
            >
              <span class="carrier-dir__tile-scale carrier-dir__tile-scale--add">
                <img :src="imgAdd" alt="" class="carrier-dir__tile-img carrier-dir__tile-img--add" draggable="false" >
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$dir-purple: #8b7dff;

.carrier-dir {
  position: fixed;
  inset: 0;
  z-index: 1;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
}

.carrier-dir__scroll {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 与 CarrierList 横向 20px 对齐；顶栏区仍白底 */
  padding: calc(16px + env(safe-area-inset-top, 0px)) 20px 40px;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.carrier-dir__header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 36px;
}

/* 对齐 CarrierList 物品区：背景仅覆盖网格及以下；repeat-y 随区域高度向下无限铺 */
.carrier-dir__list-surface {
  position: relative;
  flex: 1 0 auto;
  align-self: stretch;
  margin-left: -20px;
  margin-right: -20px;
  padding: 8px 20px 48px;
  box-sizing: border-box;
  /* 至少原稿高度，并尽量铺满视口剩余，避免底部大块留白；内容增高时整块变高 */
  min-height: max(min(360px, 50vh), calc(100svh - 280px));
}

.carrier-dir__list-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #fff;
}

.carrier-dir__list-bg-layer {
  position: absolute;
  inset: 0;
  background-color: #fff;
  background-repeat: repeat-y;
  background-position: center top;
  background-size: 100% auto;
}

.carrier-dir__list-inner {
  position: relative;
  z-index: 1;
}

.carrier-dir__avatar {
  display: block;
  width: min(112px, 30vw);
  height: auto;
  object-fit: contain;
  margin-bottom: 6px;
}

.carrier-dir__avatar--preset {
  background-repeat: no-repeat;
  image-rendering: -webkit-optimize-contrast;
  /* 尺寸由 avatarPresetPreviewStyle 内联，与上图最大幅面一致 */
}

.carrier-dir__avatar-menu {
  margin: 0 0 8px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.72;
  }
}

.carrier-dir__pagination {
  display: block;
  width: auto;
  height: 10px;
  max-width: 72px;
  object-fit: contain;
  margin: 0;
}

.carrier-dir__title {
  margin: 0;
  max-width: 320px;
  font-family: var(--font-family-app);
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: #1a1a1a;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  line-height: 1.45;
}

.carrier-dir__title-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.22s ease-out,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.carrier-dir__title-char--show {
  opacity: 1;
  transform: translateY(0);
}

/* 一排放两个：两列等宽，随屏宽伸缩 */
.carrier-dir__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
  row-gap: 16px;
  width: 100%;
  max-width: min(360px, 100%);
  margin: 0 auto;
  justify-items: stretch;
  align-items: stretch;
}

.carrier-dir__tile {
  margin: 0;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  min-width: 0;

  &:active {
    opacity: 0.88;
    transform: scale(0.97);
  }
}

.carrier-dir__tile-scale {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: scale(1.04);
  transform-origin: center center;
}

.carrier-dir__tile-scale--add {
  transform: scale(0.595);
}

.carrier-dir__tile-img {
  display: block;
  width: 100%;
  max-width: 120px;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  margin: 0 auto;
}

.carrier-dir__tile-img--add {
  max-width: 100px;
}

.carrier-dir__tile--add {
  .carrier-dir__tile-img--add {
    filter: drop-shadow(0 2px 8px rgba($dir-purple, 0.25));
  }
}
</style>
