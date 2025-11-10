<template>
  <div
    v-if="layout === 'vertical'"
    class="flex flex-col items-center gap-0.5 rounded-lg bg-white px-2 py-1.5
      shadow-sm"
  >
    <span
      class="max-w-full truncate text-center text-xs font-medium text-gray-800"
      :title="player.name"
      >{{ player.name }}</span
    >
    <StarRating :model-value="player.weight" :disabled="true" size="sm" />
  </div>

  <span
    v-else
    class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1
      text-xs md:px-3 md:text-sm"
  >
    <span
      class="max-w-[120px] truncate font-medium text-gray-800"
      :title="player.name"
      >{{ player.name }}</span
    >
    <StarRating :model-value="player.weight" :disabled="true" size="sm" />
  </span>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'

defineProps<{
  player: Player
  layout?: 'horizontal' | 'vertical'
}>()
</script>
