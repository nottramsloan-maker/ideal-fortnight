<script setup lang="ts">
import { usePoemPreview } from '@/composables/usePoemPreview'

const props = withDefaults(
  defineProps<{
    ownPoem: string
    otherPoem: string
    hint?: string
  }>(),
  { hint: '按住看同好诗句' },
)

const { showingOthers, onPointerDown, onPointerUp, onPointerCancel } = usePoemPreview()
</script>

<template>
  <div class="poem-switch">
    <p class="poem-switch__text">
      {{ showingOthers ? otherPoem : ownPoem }}
    </p>
    <button
      type="button"
      class="poem-switch__hold"
      :aria-pressed="showingOthers"
      aria-label="按住切换为他人生成的诗句，松开恢复"
      @pointerdown.prevent="onPointerDown"
      @pointerup.prevent="onPointerUp"
      @pointerleave="onPointerCancel"
      @pointercancel="onPointerCancel"
    >
      {{ hint }}
    </button>
  </div>
</template>

<style scoped lang="scss">
$purple: #8470ff;
$font: var(--font-family-app);

.poem-switch {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.poem-switch__text {
  margin: 0;
  font-family: $font;
  font-size: 15px;
  line-height: 1.55;
  color: #333;
  min-height: 4.5em;
  transition: opacity 0.15s ease;
}

.poem-switch__hold {
  align-self: flex-start;
  margin: 0;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid $purple;
  background: rgba(132, 112, 255, 0.08);
  font-family: $font;
  font-size: 13px;
  font-weight: 600;
  color: $purple;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: rgba(132, 112, 255, 0.18);
  }
}
</style>
