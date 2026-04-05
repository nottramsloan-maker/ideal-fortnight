<script setup lang="ts">
import { useRouter } from 'vue-router'
import ItemPhotoCapture from '@/components/ItemPhotoCapture.vue'

const router = useRouter()

function onClose() {
  router.back()
}

function onCaptured() {
  router.push({ name: 'item-ai', params: { id: 'new' } })
}
</script>

<template>
  <ItemPhotoCapture @close="onClose" @captured="onCaptured" />
</template>
