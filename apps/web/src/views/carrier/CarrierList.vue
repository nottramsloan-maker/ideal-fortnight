<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import imgListItemBg from '@card-assets/背景.png'
import imgListHero from '@/assets/carrier-list-hero.png'
import imgToolGrid from '@/assets/carrier-list-toolbar/grid.png'
import imgToolAdd from '@/assets/carrier-list-toolbar/group-7.png'
import imgToolShare from '@/assets/carrier-list-toolbar/share.png'
import imgShareCardBg from '@/assets/share-card/card-bg.png'
import imgShareClose from '@/assets/share-card/btn-close.png'
import imgShareBtn from '@/assets/share-card/btn-share.png'
import imgShareDownload from '@/assets/share-card/btn-download.png'

const router = useRouter()
const itemStore = useItemStore()
const { committedHouseItems } = storeToRefs(itemStore)

const bodyPrevOverflow = ref('')
const shareModalOpen = ref(false)

function openShareModal() {
  shareModalOpen.value = true
}

function closeShareModal() {
  shareModalOpen.value = false
}

function onShareCardShare() {
  if (typeof navigator !== 'undefined' && navigator.share) {
    void navigator
      .share({
        title: '兴趣清单',
        text: 'Welcome home.',
      })
      .catch(() => {})
  }
}

function onShareCardDownload() {
  const a = document.createElement('a')
  a.href = imgShareCardBg
  a.download = 'share-card.png'
  a.rel = 'noopener'
  a.click()
}

function onShareKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeShareModal()
}

watch(shareModalOpen, (open) => {
  if (open) window.addEventListener('keydown', onShareKeydown)
  else window.removeEventListener('keydown', onShareKeydown)
})

function openCommittedCard(committedId: string) {
  void router.push({ name: 'item-card-view', params: { committedId } })
}

function onAddItem() {
  itemStore.setCommitListTarget('house')
  itemStore.setAfterCardNavigation({ name: 'carrier-list' })
  void router.push({ name: 'item-new' })
}

function onOpenCarrierDirectory() {
  void router.push({ name: 'carrier-directory' })
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onShareKeydown)
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div class="carrier-list">
    <div class="carrier-list__frame">
      <div class="carrier-list__stage">
        <div class="carrier-list__scroll">
          <!-- 参考稿：顶区纯白，房子约占屏高 25%～30%，与工具栏留白 -->
          <div class="carrier-list__top">
            <div class="carrier-list__hero">
              <img
                :src="imgListHero"
                alt=""
                class="carrier-list__house"
                draggable="false"
              >
            </div>

            <div class="carrier-list__toolbar" role="toolbar" aria-label="快捷操作">
              <div class="carrier-list__toolbar-side carrier-list__toolbar-side--left">
                <button
                  type="button"
                  class="carrier-list__tool-btn"
                  aria-label="载体清单"
                  @click="onOpenCarrierDirectory"
                >
                  <img
                    :src="imgToolGrid"
                    alt=""
                    class="carrier-list__tool-img carrier-list__tool-img--side"
                    draggable="false"
                  >
                </button>
              </div>
              <div class="carrier-list__toolbar-center">
                <button type="button" class="carrier-list__tool-btn" aria-label="添加" @click="onAddItem">
                  <img
                    :src="imgToolAdd"
                    alt=""
                    class="carrier-list__tool-img carrier-list__tool-img--center"
                    draggable="false"
                  >
                </button>
              </div>
              <div class="carrier-list__toolbar-side carrier-list__toolbar-side--right">
                <button
                  type="button"
                  class="carrier-list__tool-btn"
                  aria-label="分享"
                  @click="openShareModal"
                >
                  <img
                    :src="imgToolShare"
                    alt=""
                    class="carrier-list__tool-img carrier-list__tool-img--side"
                    draggable="false"
                  >
                </button>
              </div>
            </div>
          </div>

          <!-- 物品区：整段铺 背景.png，无物品时也占满首屏剩余高度 -->
          <div class="carrier-list__list-surface">
            <div class="carrier-list__list-dots" aria-hidden="true">
              <div
                class="carrier-list__list-dots-layer"
                :style="{ backgroundImage: `url(${imgListItemBg})` }"
              />
            </div>
            <div class="carrier-list__list-inner">
              <div
                v-if="committedHouseItems.length"
                class="carrier-list__committed-grid"
                role="list"
                aria-label="已完成的物品"
              >
                <button
                  v-for="row in committedHouseItems"
                  :key="row.id"
                  type="button"
                  class="carrier-list__committed-cell"
                  @click="openCommittedCard(row.id)"
                >
                  <div class="carrier-list__committed-thumb-wrap">
                    <img
                      :src="row.imageUrl"
                      :alt="row.title"
                      class="carrier-list__committed-thumb"
                      draggable="false"
                    >
                  </div>
                  <p class="carrier-list__committed-date">
                    {{ row.date }}
                  </p>
                  <p class="carrier-list__committed-title">
                    {{ row.title }}
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="shareModalOpen"
        class="carrier-list-share"
        role="dialog"
        aria-modal="true"
        aria-label="分享卡片"
      >
        <button
          type="button"
          class="carrier-list-share__backdrop"
          aria-label="关闭"
          @click="closeShareModal"
        />
        <button
          type="button"
          class="carrier-list-share__close"
          aria-label="关闭"
          @click="closeShareModal"
        >
          <img :src="imgShareClose" alt="" width="24" height="24" draggable="false" >
        </button>

        <div class="carrier-list-share__stack">
          <div class="carrier-list-share__stack-spacer carrier-list-share__stack-spacer--top" aria-hidden="true" />
          <div class="carrier-list-share__sheet">
            <div class="carrier-list-share__card-wrap">
              <img
                :src="imgShareCardBg"
                alt=""
                class="carrier-list-share__card"
                draggable="false"
              >
            </div>
          </div>
          <div class="carrier-list-share__share-gap">
            <button
              type="button"
              class="carrier-list-share__action carrier-list-share__action--share"
              aria-label="分享"
              @click="onShareCardShare"
            >
              <img
                :src="imgShareBtn"
                alt=""
                class="carrier-list-share__share-img"
                draggable="false"
              >
            </button>
          </div>
        </div>

        <div class="carrier-list-share__bottom-dock">
          <button
            type="button"
            class="carrier-list-share__download-dock"
            aria-label="下载"
            @click="onShareCardDownload"
          >
            <img
              :src="imgShareDownload"
              alt=""
              class="carrier-list-share__download-dock-img"
              draggable="false"
            >
          </button>
        </div>
      </div>
    </Teleport>
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
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  background: #fff;
  overflow: hidden;
}

.carrier-list__frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.carrier-list__stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.carrier-list__scroll {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 整体下移 30px，减轻底部大块留白观感 */
  padding: 30px 20px 32px;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.carrier-list__top {
  flex-shrink: 0;
  background: #fff;
}

.carrier-list__hero {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 0 20px;
  min-height: 0;
}

/* 约 844×0.28 ≈ 236px，与参考稿「房子占竖向约 25%～30%」一致 */
.carrier-list__house {
  display: block;
  width: auto;
  height: auto;
  max-height: min(236px, 28vh);
  max-width: min(280px, 78%);
  object-fit: contain;
}

.carrier-list__toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 8px 0 28px;
  box-sizing: border-box;
}

.carrier-list__toolbar-side {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  min-width: 0;

  &--left {
    justify-content: flex-start;
  }

  &--right {
    justify-content: flex-end;
  }
}

.carrier-list__toolbar-center {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
}

.carrier-list__tool-btn {
  margin: 0;
  padding: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.72;
    transform: scale(0.96);
  }
}

.carrier-list__tool-img {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.carrier-list__tool-img--side {
  width: calc(28px * 0.8);
  height: calc(28px * 0.8);
}

/* 中间「添加」略大；与两侧统一按原稿 ×0.8 */
.carrier-list__tool-img--center {
  width: calc(36px * 0.8);
  height: calc(36px * 0.8);
}

.carrier-list__list-surface {
  position: relative;
  flex: 1 1 auto;
  margin-left: -20px;
  margin-right: -20px;
  padding: 8px 20px 8px;
  min-height: min(360px, 50vh);
}

.carrier-list__list-dots {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #fff;
}

.carrier-list__list-dots-layer {
  position: absolute;
  inset: 0;
  background-color: #fff;
  background-repeat: repeat-y;
  background-position: center top;
  background-size: 100% auto;
}

.carrier-list__list-inner {
  position: relative;
  z-index: 1;
}

.carrier-list__committed-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 10px;
  width: 100%;
  margin-bottom: 28px;
}

.carrier-list__committed-cell {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.82;
    transform: scale(0.98);
  }
}

.carrier-list__committed-thumb-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carrier-list__committed-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  vertical-align: top;
}

.carrier-list__committed-date {
  margin: 8px 0 0;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: #3a3a3a;
  line-height: 1.3;
}

.carrier-list__committed-title {
  margin: 4px 0 0;
  padding: 0 2px;
  font-family: var(--font-family-app);
  font-size: 9px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
}

/* —— 分享卡片（参考 P1：蒙层 + 圆角卡 + 关闭 / 分享 / 下载）—— */
.carrier-list-share {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 20px
    calc(100px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  pointer-events: auto;
}

.carrier-list-share__stack {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.carrier-list-share__stack-spacer--top {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}

.carrier-list-share__share-gap {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  padding: 0 8px 8px;
  /* 大卡与「分享」间距收 30px，大卡位置不变 */
  margin-top: -30px;
}

.carrier-list-share__backdrop {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.48);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.carrier-list-share__sheet {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: min(320px, 88vw);
  pointer-events: auto;
  transform: scale(0.8);
  transform-origin: center center;
}

.carrier-list-share__card-wrap {
  position: relative;
  width: 100%;
  border-radius: 48px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  line-height: 0;
  background: #f4f4f4;
}

.carrier-list-share__close {
  position: fixed;
  top: calc(8px + env(safe-area-inset-top, 0px));
  right: calc(10px + env(safe-area-inset-right, 0px));
  z-index: 203;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
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
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
  }

  &:active {
    opacity: 0.75;
  }
}

.carrier-list-share__card {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  object-fit: cover;
}

/* 素材约 107×67；原 ×1.5 再 ×0.7 */
.carrier-list-share__action {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.82;
    transform: scale(0.98);
  }
}

.carrier-list-share__share-img {
  display: block;
  width: calc(107px * 1.5 * 0.7);
  max-width: 88vw;
  height: auto;
  object-fit: contain;
}

/* 下载固定在屏幕底部拇指区，不受 sheet 的 scale(0.8) 影响 */
.carrier-list-share__bottom-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 202;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  /* 「分享」与下载间距收 30px，且不低于安全区 */
  padding: 0 24px max(8px, calc(20px + env(safe-area-inset-bottom, 0px) - 30px));
  box-sizing: border-box;
  pointer-events: none;
}

.carrier-list-share__download-dock {
  pointer-events: auto;
  margin: 0;
  padding: 16px 20px;
  border: none;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.75;
  }
}

.carrier-list-share__download-dock-img {
  display: block;
  width: calc(32px * 0.7);
  height: calc(32px * 0.7);
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}
</style>
