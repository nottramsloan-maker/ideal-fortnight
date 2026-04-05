<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.meta.title,
  (title) => {
    if (typeof title === 'string' && title.length > 0) {
      document.title = `${title} · 兴趣清单`
    }
  },
  { immediate: true },
)
</script>

<template>
  <router-view />
</template>
