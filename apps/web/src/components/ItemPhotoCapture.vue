<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useItemStore } from '@/stores/item'
import shutterImg from '@/assets/figma/item-capture/shutter.png'
import confirmRetakePng from '@/assets/item-photo-capture/confirm-retake.png'
import confirmCheckPng from '@/assets/item-photo-capture/confirm-check.png'
import confirmCropPng from '@/assets/item-photo-capture/confirm-crop.png'

const emit = defineEmits<{
  close: []
  captured: [blob: Blob]
}>()

const itemStore = useItemStore()

const rootRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const bodyPrevOverflow = ref('')
const FRAME_CSS_W = 390
const FRAME_CSS_H = 844

/** 取景 / 拍后确认（布局对齐 暂存截图/相机.png，390×844 设计稿） */
const phase = ref<'camera' | 'confirm'>('camera')
const pendingBlob = ref<Blob | null>(null)
const previewUrl = ref<string | null>(null)

let stream: MediaStream | null = null

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

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    const v = videoRef.value
    if (v) {
      v.srcObject = stream
      await v.play().catch(() => {})
    }
  } catch {
    stream = null
  }
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  const v = videoRef.value
  if (v) v.srcObject = null
}

function onClose() {
  emit('close')
}

function openImagePicker() {
  fileInputRef.value?.click()
}

function cleanupPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function enterConfirmWithBlob(blob: Blob) {
  cleanupPreview()
  pendingBlob.value = blob
  previewUrl.value = URL.createObjectURL(blob)
  phase.value = 'confirm'
  stopCamera()
}

function finishWithBlob(blob: Blob) {
  itemStore.setPendingCapture(blob)
  emit('captured', blob)
}

function onShutter() {
  const v = videoRef.value
  if (!v || !stream || v.readyState < 2) {
    openImagePicker()
    return
  }
  const w = v.videoWidth
  const h = v.videoHeight
  if (w <= 0 || h <= 0) {
    openImagePicker()
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(v, 0, 0)
  canvas.toBlob(
    (blob) => {
      if (blob) enterConfirmWithBlob(blob)
    },
    'image/jpeg',
    0.92,
  )
}

function onConfirmRetake() {
  cleanupPreview()
  pendingBlob.value = null
  phase.value = 'camera'
  void nextTick().then(() => {
    updateFrameScale()
    void startCamera()
  })
}

function onConfirmUse() {
  const blob = pendingBlob.value
  if (!blob) return
  cleanupPreview()
  pendingBlob.value = null
  phase.value = 'camera'
  finishWithBlob(blob)
}

function onConfirmCrop() {
  openImagePicker()
}

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  enterConfirmWithBlob(file)
}

onMounted(() => {
  bodyPrevOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  void nextTick().then(() => {
    updateFrameScale()
    void startCamera()
  })
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  stopCamera()
  cleanupPreview()
  document.body.style.overflow = bodyPrevOverflow.value
})
</script>

<template>
  <div ref="rootRef" class="item-photo-capture">
    <div ref="frameRef" class="item-photo-capture__frame">
      <div class="item-photo-capture__stage">
        <video
          v-show="phase === 'camera'"
          ref="videoRef"
          class="item-photo-capture__video"
          playsinline
          muted
          autoplay
          aria-hidden="true"
        />

        <div v-show="phase === 'camera'" class="item-photo-capture__guide" aria-hidden="true">
          <div class="item-photo-capture__guide-box">
            <span class="item-photo-capture__corner item-photo-capture__corner--tl" />
            <span class="item-photo-capture__corner item-photo-capture__corner--tr" />
            <span class="item-photo-capture__corner item-photo-capture__corner--bl" />
            <span class="item-photo-capture__corner item-photo-capture__corner--br" />
            <p class="item-photo-capture__hint">
              请将物品放置于框内
            </p>
          </div>
        </div>

        <div
          v-show="phase === 'confirm'"
          class="item-photo-capture__confirm"
        >
          <div class="item-photo-capture__confirm-preview">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt=""
              class="item-photo-capture__confirm-photo"
            >
          </div>
          <nav class="item-photo-capture__bar item-photo-capture__bar--confirm" aria-label="确认照片">
            <button
              type="button"
              class="item-photo-capture__confirm-side"
              aria-label="重拍"
              @click="onConfirmRetake"
            >
              <img
                :src="confirmRetakePng"
                alt=""
                class="item-photo-capture__confirm-side-img"
                draggable="false"
              >
            </button>
            <button
              type="button"
              class="item-photo-capture__confirm-main"
              aria-label="使用照片"
              @click="onConfirmUse"
            >
              <img
                :src="confirmCheckPng"
                alt=""
                class="item-photo-capture__confirm-main-img"
                draggable="false"
              >
            </button>
            <button
              type="button"
              class="item-photo-capture__confirm-side"
              aria-label="裁切"
              @click="onConfirmCrop"
            >
              <img
                :src="confirmCropPng"
                alt=""
                class="item-photo-capture__confirm-side-img"
                draggable="false"
              >
            </button>
          </nav>
        </div>

        <nav
          v-show="phase === 'camera'"
          class="item-photo-capture__bar item-photo-capture__bar--camera"
          aria-label="拍照操作"
        >
          <button
            type="button"
            class="item-photo-capture__side-btn"
            aria-label="关闭"
            @click="onClose"
          >
            <svg class="item-photo-capture__icon-x" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7L7 17"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="item-photo-capture__shutter"
            aria-label="拍照"
            @click="onShutter"
          >
            <img
              :src="shutterImg"
              alt=""
              class="item-photo-capture__shutter-img"
              width="72"
              height="72"
              draggable="false"
            >
          </button>

          <button
            type="button"
            class="item-photo-capture__side-btn"
            aria-label="从相册选择"
            @click="openImagePicker"
          >
            <svg class="item-photo-capture__icon-gallery" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="4.5"
                y="5.5"
                width="15"
                height="13"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M7 16.5 L10.2 13.3 L13.5 16.5 L17 13"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="16.5" cy="9.5" r="1.35" fill="currentColor" />
            </svg>
          </button>
        </nav>

        <input
          ref="fileInputRef"
          type="file"
          class="item-photo-capture__file"
          accept="image/*"
          @change="onFileChange"
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$item-capture-bg: #927959;
$item-capture-side: rgba(45, 38, 32, 0.42);

/* 取景 + 拍后确认 共用：左右边距、底距、侧键/主键尺寸与绝对坐标一致 */
$photo-bar-inset-x: 44px;
$photo-bar-bottom: 28px;
$photo-bar-side-size: 48px;
$photo-bar-main-size: 88px;
$photo-bar-main-inner: 72px; /* 取景快门图在圆内占比；确认 PNG 同槽位 contain */
$photo-bar-side-nudge: ($photo-bar-main-size - $photo-bar-side-size) * 0.5;
$photo-bar-height: calc(
  #{$photo-bar-main-size} + #{$photo-bar-bottom} + env(safe-area-inset-bottom, 0px)
);

.item-photo-capture {
  position: fixed;
  inset: 0;
  z-index: 2;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $item-capture-bg;
  overflow: hidden;
}

.item-photo-capture__frame {
  position: relative;
  width: 390px;
  height: 844px;
  flex-shrink: 0;
  box-sizing: border-box;
  background: $item-capture-bg;
  transform-origin: center center;
}

.item-photo-capture__stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: $item-capture-bg;
  overflow: hidden;
}

.item-photo-capture__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: $item-capture-bg;
}

.item-photo-capture__guide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.item-photo-capture__guide-box {
  position: relative;
  width: 272px;
  height: 272px;
  margin-top: -72px;
}

$item-capture-corner: 3px;
$item-capture-corner-len: 38px;

.item-photo-capture__corner {
  position: absolute;
  width: $item-capture-corner-len;
  height: $item-capture-corner-len;
  border-color: #fff;
  border-style: solid;

  &--tl {
    left: 0;
    top: 0;
    border-width: $item-capture-corner 0 0 $item-capture-corner;
    border-radius: 2px 0 0 0;
  }

  &--tr {
    right: 0;
    top: 0;
    border-width: $item-capture-corner $item-capture-corner 0 0;
    border-radius: 0 2px 0 0;
  }

  &--bl {
    left: 0;
    bottom: 0;
    border-width: 0 0 $item-capture-corner $item-capture-corner;
    border-radius: 0 0 0 2px;
  }

  &--br {
    right: 0;
    bottom: 0;
    border-width: 0 $item-capture-corner $item-capture-corner 0;
    border-radius: 0 0 2px 0;
  }
}

.item-photo-capture__hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  margin: 0;
  padding: 0 8px;
  box-sizing: border-box;
  text-align: center;
  font-family: var(--font-family-app);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.45;
  color: #fff;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.item-photo-capture__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
}

.item-photo-capture__bar--camera {
  height: $photo-bar-height;
  padding: 0;
  pointer-events: none;
}

.item-photo-capture__bar--camera .item-photo-capture__side-btn,
.item-photo-capture__bar--camera .item-photo-capture__shutter {
  pointer-events: auto;
}

.item-photo-capture__side-btn {
  width: $photo-bar-side-size;
  height: $photo-bar-side-size;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: $item-capture-side;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;

  &:active {
    opacity: 0.88;
    transform: scale(0.96);
  }
}

.item-photo-capture__bar--camera .item-photo-capture__side-btn {
  position: absolute;
  bottom: calc(#{$photo-bar-bottom} + env(safe-area-inset-bottom, 0px) + #{$photo-bar-side-nudge});
  left: $photo-bar-inset-x;

  &:last-of-type {
    left: auto;
    right: $photo-bar-inset-x;
  }
}

.item-photo-capture__icon-x {
  width: 22px;
  height: 22px;
}

.item-photo-capture__icon-gallery {
  width: 24px;
  height: 24px;
}

.item-photo-capture__shutter {
  width: $photo-bar-main-size;
  height: $photo-bar-main-size;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));

  &:active {
    transform: scale(0.95);
  }
}

.item-photo-capture__bar--camera .item-photo-capture__shutter {
  position: absolute;
  left: 50%;
  bottom: calc(#{$photo-bar-bottom} + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.item-photo-capture__shutter-img {
  width: $photo-bar-main-inner;
  height: $photo-bar-main-inner;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.item-photo-capture__file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* —— 拍后确认（底栏与截图一致：左右 92px 资源 @2x → 46px，中 204 → 102px） —— */
.item-photo-capture__confirm {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: $item-capture-bg;
  pointer-events: auto;
}

.item-photo-capture__confirm-preview {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 28px $photo-bar-height;
  box-sizing: border-box;
}

.item-photo-capture__confirm-photo {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  vertical-align: middle;
  filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.28)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12));
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}

.item-photo-capture__bar--confirm {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: $photo-bar-height;
  padding: 0;
  flex-shrink: 0;
  pointer-events: none;
  box-sizing: border-box;
}

.item-photo-capture__bar--confirm .item-photo-capture__confirm-side,
.item-photo-capture__bar--confirm .item-photo-capture__confirm-main {
  pointer-events: auto;
}

.item-photo-capture__confirm-side,
.item-photo-capture__confirm-main {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  line-height: 0;
}

.item-photo-capture__confirm-side {
  width: $photo-bar-side-size;
  height: $photo-bar-side-size;
  border-radius: 50%;

  &:active {
    opacity: 0.92;
    transform: scale(0.96);
  }
}

.item-photo-capture__bar--confirm .item-photo-capture__confirm-side {
  position: absolute;
  bottom: calc(#{$photo-bar-bottom} + env(safe-area-inset-bottom, 0px) + #{$photo-bar-side-nudge});
  left: $photo-bar-inset-x;

  &:last-of-type {
    left: auto;
    right: $photo-bar-inset-x;
  }
}

.item-photo-capture__confirm-main {
  width: $photo-bar-main-size;
  height: $photo-bar-main-size;
  border-radius: 50%;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.item-photo-capture__bar--confirm .item-photo-capture__confirm-main {
  position: absolute;
  left: 50%;
  bottom: calc(#{$photo-bar-bottom} + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.item-photo-capture__confirm-side-img {
  width: 100%;
  height: 100%;
  max-width: $photo-bar-side-size;
  max-height: $photo-bar-side-size;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.item-photo-capture__confirm-main-img {
  width: $photo-bar-main-inner;
  height: $photo-bar-main-inner;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
</style>
