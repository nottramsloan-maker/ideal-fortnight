<script setup lang="ts">
defineProps<{
  /** 用户物品照片（优先） */
  imageUrl?: string | null
  /** 无照片时的手绘占位符 id */
  stamp?: string
}>()
</script>

<template>
  <div class="row-icon">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt=""
      class="row-icon__photo"
      draggable="false"
    >
    <svg
      v-else
      class="row-icon__svg"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- 极简手绘风描边，对应参考稿各类小图 -->
      <g
        v-if="stamp === 'bottle'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 8h12v4l-2 3v16H16V15l-2-3V8z" />
        <path d="M16 8V6h8v2" />
      </g>
      <g
        v-else-if="stamp === 'lantern'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M12 14h16v12H12z" />
        <path d="M20 10v4M16 26v6M24 26v6" />
        <path d="M14 20h12" />
      </g>
      <g
        v-else-if="stamp === 'trowel'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 28l8-14 6 3-8 14z" />
        <path d="M18 14l4-6 6 4-4 6" />
      </g>
      <g
        v-else-if="stamp === 'fork'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M22 8v24" />
        <path d="M16 8v10M19 8v10M22 8v10M25 8v10" />
      </g>
      <g
        v-else-if="stamp === 'pot'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 18h16l-1 14H13L12 18z" />
        <path d="M14 18c0-4 3-7 6-7s6 3 6 7" />
      </g>
      <g
        v-else-if="stamp === 'can'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M14 16c0-2 2.5-4 6-4s6 2 6 4v14c0 2-2.5 4-6 4s-6-2-6-4V16z" />
        <path d="M14 16h12" />
        <path d="M18 22h4" />
      </g>
      <g
        v-else-if="stamp === 'chair'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 30V18h16v12" />
        <path d="M10 18h20" />
        <path d="M14 30v4M26 30v4" />
      </g>
      <g
        v-else-if="stamp === 'clock'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M20 10c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10z" />
        <path d="M20 16v6l4 2" />
      </g>
      <g
        v-else-if="stamp === 'cage'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M12 14h16v20H12z" />
        <path d="M16 14v20M20 14v20M24 14v20" />
        <path d="M18 22c0-2 1-3 2-3s2 1 2 3" />
      </g>
      <g
        v-else-if="stamp === 'bag'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 18h16l2 14H10l2-14z" />
        <path d="M16 18c0-4 1.5-6 4-6s4 2 4 6" />
      </g>
      <g
        v-else-if="stamp === 'plate'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <ellipse cx="20" cy="20" rx="12" ry="6" />
        <ellipse cx="20" cy="20" rx="8" ry="3" />
      </g>
      <g
        v-else-if="stamp === 'cutlery'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M14 8v20M14 8c2 0 3 2 3 4v6" />
        <path d="M20 8v20" />
        <path d="M26 10l-2 18" />
      </g>
      <g
        v-else-if="stamp === 'mitt'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M16 10c4 0 6 3 6 7v10c0 3-2 5-5 5h-2c-3 0-5-2-5-5V14" />
        <path d="M14 22v6M17 24v5M20 25v4M23 24v5" />
      </g>
      <g
        v-else-if="stamp === 'pan'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M8 22h22c0 6-5 10-11 10S8 28 8 22z" />
        <path d="M30 22h6" />
      </g>
      <g
        v-else-if="stamp === 'casserole'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M11 19h18v11H11z" />
        <path d="M10 19h20" />
        <path d="M14 19v-3c0-2 2-4 6-4s6 2 6 4v3" />
      </g>
      <g
        v-else-if="stamp === 'mug'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 14h12v14H12z" />
        <path d="M24 18h4c2 0 3 1 3 3s-1 3-3 3h-4" />
      </g>
      <g
        v-else-if="stamp === 'bowl'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M10 18h20c0 8-4 12-10 12S10 26 10 18z" />
        <path d="M12 18c2-4 5-6 8-6s6 2 8 6" />
      </g>
      <g
        v-else-if="stamp === 'teapot'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 22c0-6 4-10 10-10s10 4 10 10v6H10v-6z" />
        <path d="M16 12c-2-2-4-2-6 0" />
        <path d="M20 8v4" />
      </g>
      <g
        v-else-if="stamp === 'raincoat'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 16h12l4 14H10l4-14z" />
        <path d="M20 10c-3 0-5 2-6 6" />
      </g>
      <g
        v-else-if="stamp === 'umbrella'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M8 20c3-6 7-8 12-8s9 2 12 8" />
        <path d="M20 12v22" />
      </g>
      <g
        v-else-if="stamp === 'umbrella-open'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <path d="M6 22c4-8 10-12 14-12s10 4 14 12" />
        <path d="M20 10v24M14 26h12" />
      </g>
      <g
        v-else-if="stamp === 'teru'"
        stroke="#0a0a0a"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <circle cx="20" cy="14" r="8" />
        <path d="M20 22v10M16 32h8" />
      </g>
      <circle
        v-else
        cx="20"
        cy="20"
        r="10"
        stroke="#0a0a0a"
        stroke-width="2.2"
      />
    </svg>
  </div>
</template>

<style scoped lang="scss">
.row-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-icon__photo {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
  filter: contrast(1.08) grayscale(0.15);
}

.row-icon__svg {
  width: 44px;
  height: 44px;
  display: block;
}
</style>
