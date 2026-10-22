<template>
  <div class="flex items-center gap-2">
    <USlider
      :min="SKILL_MIN"
      :max="SKILL_MAX"
      :step="SKILL_STEP"
      :model-value="modelValue"
      :disabled="disabled"
      aria-label="Nível de habilidade"
      class="w-24 sm:w-28"
      @update:model-value="(value) => $emit('update', value as number)"
    />
    <span
      class="w-9 shrink-0 text-right text-sm font-semibold text-gray-700
        tabular-nums"
    >
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { SKILL_MAX, SKILL_MIN, SKILL_STEP } from '~/utils/playerProfile'

interface Props {
  modelValue: number
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})

defineEmits<{
  update: [value: number]
}>()
</script>
