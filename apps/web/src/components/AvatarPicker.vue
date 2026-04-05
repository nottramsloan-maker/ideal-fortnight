<script setup lang="ts">
/** 预制头像选择 — 布局待按 Figma AvatarPicker Frame 还原 */
defineProps<{
  modelValue?: string | null
}>()
defineEmits<{
  'update:modelValue': [id: string]
}>()
</script>

<template>
  <div class="avatar-picker">
    <slot />
  </div>
</template>

<style scoped>
.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
