<template>
  <div
    v-if="layout === 'vertical'"
    class="flex flex-col items-center gap-0.5 rounded-lg bg-white px-2 py-1.5
      shadow-sm"
  >
    <span
      class="max-w-full truncate text-center text-xs font-medium text-gray-800"
      :title="player.name"
      ><span v-if="player.seed" title="Cabeça de chave">⭐</span
      ><span :class="genderColor" class="font-bold">{{ genderSymbol }}</span>
      {{ player.name }}</span
    >
    <div class="flex items-center gap-1">
      <span :class="skillClasses" :title="skillTitle">{{ skillLabel }}</span>
      <span
        v-for="position in playerPositions"
        :key="position"
        class="rounded bg-emerald-50 px-1 text-[10px] font-semibold
          text-emerald-700"
        :title="POSITION_LABELS[position].full"
        >{{ POSITION_LABELS[position].short }}</span
      >
    </div>
  </div>

  <span
    v-else
    class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1
      text-xs md:px-3 md:text-sm"
  >
    <span
      class="max-w-[120px] truncate font-medium text-gray-800"
      :title="player.name"
      ><span v-if="player.seed" title="Cabeça de chave">⭐</span
      ><span :class="genderColor" class="font-bold">{{ genderSymbol }}</span>
      {{ player.name }}</span
    >
    <span :class="skillClasses" :title="skillTitle">{{ skillLabel }}</span>
    <span
      v-for="position in playerPositions"
      :key="position"
      class="rounded bg-emerald-50 px-1 text-[10px] font-semibold
        text-emerald-700"
      :title="POSITION_LABELS[position].full"
      >{{ POSITION_LABELS[position].short }}</span
    >
  </span>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'
import { POSITIONS, POSITION_LABELS, SKILL_MAX } from '~/utils/playerProfile'

const props = defineProps<{
  player: Player
  layout?: 'horizontal' | 'vertical'
}>()

const genderSymbol = computed(() => (props.player.gender === 'F' ? '♀' : '♂'))
const genderColor = computed(() =>
  props.player.gender === 'F' ? 'text-pink-500' : 'text-blue-500',
)

const skillLabel = computed(() => props.player.weight.toFixed(1))
const skillTitle = computed(
  () => `Habilidade ${skillLabel.value} de ${SKILL_MAX}`,
)
const skillClasses =
  'rounded bg-yellow-100 px-1 text-[10px] font-bold tabular-nums text-yellow-800'

const playerPositions = computed(() =>
  POSITIONS.filter((position) => props.player.positions?.[position]),
)
</script>
