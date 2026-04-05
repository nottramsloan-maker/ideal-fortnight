<script setup lang="ts">
/** 本人 / 他人诗句按住切换 — 交互见 PRD，样式见 Figma */
defineProps<{
  myPoem?: string
  othersPoems?: string[]
}>()
</script>

<template>
  <div class="poem-switch">
    <p v-if="myPoem">{{ myPoem }}</p>
    <p v-else class="poem-switch__empty">诗句占位</p>
  </div>
</template>

<style scoped>
.poem-switch__empty {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
