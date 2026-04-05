<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FIGMA_PLACEHOLDER } from '@/constants/copy'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <main class="page public-landing">
    <h1 class="page__title">分享落地页</h1>
    <p class="page__placeholder">
      slug: <code>{{ slug }}</code><br >
      {{ FIGMA_PLACEHOLDER }}
      技术方案要求：仅成品卡 + 载体目录 + 小程序 CTA，无物品故事详情。
    </p>
  </main>
</template>

<style scoped>
.public-landing code {
  font-size: 13px;
  word-break: break-all;
}
</style>
