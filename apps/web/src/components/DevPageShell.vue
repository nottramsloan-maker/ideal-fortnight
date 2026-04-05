<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FIGMA_PLACEHOLDER } from '@/constants/copy'

const route = useRoute()
</script>

<template>
  <main class="page">
    <h1 class="page__title">{{ route.meta.title }}</h1>
    <p class="page__placeholder">
      {{ FIGMA_PLACEHOLDER }}
    </p>
    <slot />
  </main>
</template>
