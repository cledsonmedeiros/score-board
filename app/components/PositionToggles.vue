<template>
  <div class="flex gap-1" role="group" aria-label="Posições do jogador">
    <button
      v-for="position in POSITIONS"
      :key="position"
      type="button"
      :aria-pressed="modelValue[position]"
      :title="POSITION_LABELS[position].full"
      @click="toggle(position)"
      class="rounded-md border px-2 text-xs font-semibold transition-colors"
      :class="[
        size === 'sm' ? 'h-8' : 'h-[38px]',
        modelValue[position]
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400',
      ]"
    >
      {{ POSITION_LABELS[position].short }}
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  POSITIONS,
  POSITION_LABELS,
  type PlayerPositions,
  type Position,
} from '~/utils/playerProfile'

const props = withDefaults(
  defineProps<{
    modelValue: PlayerPositions
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{
  update: [value: PlayerPositions]
}>()

const toggle = (position: Position) => {
  emit('update', {
    ...props.modelValue,
    [position]: !props.modelValue[position],
  })
}
</script>
