<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <header class="app-header">
    <slot name="left" />
    <h1 v-if="title" class="app-header__title">{{ title }}</h1>
    <slot name="right" />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 0 4px;
}

.app-header__title {
  margin: 0;
  flex: 1;
  text-align: center;
  font: var(--font-title);
  font-size: 17px;
}
</style>
