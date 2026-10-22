<template>
  <div class="flex gap-1" role="group" aria-label="Posições do jogador">
    <UButton
      v-for="position in POSITIONS"
      :key="position"
      :size="size"
      :color="modelValue[position] ? 'success' : 'neutral'"
      :variant="modelValue[position] ? 'subtle' : 'outline'"
      :aria-pressed="modelValue[position]"
      :title="POSITION_LABELS[position].full"
      :label="POSITION_LABELS[position].short"
      :class="modelValue[position] ? '' : 'text-dimmed'"
      @click="toggle(position)"
    />
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
