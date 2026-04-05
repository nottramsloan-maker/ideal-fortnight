<script setup lang="ts">
/** 外链落地页载体目录：无详情跳转（技术方案 §5.4） */
export type PublicCarrierRow = {
  id: string
  title: string
  cover_thumb?: string
  template_type?: string
  item_count?: number
}

defineProps<{
  carriers: PublicCarrierRow[]
}>()
</script>

<template>
  <ul class="carrier-dir">
    <li v-for="c in carriers" :key="c.id" class="carrier-dir__row">
      <span class="carrier-dir__title">{{ c.title }}</span>
    </li>
  </ul>
</template>

<style scoped>
.carrier-dir {
  margin: 0;
  padding: 0;
  list-style: none;
}

.carrier-dir__row {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.carrier-dir__title {
  font-size: 15px;
}
</style>
