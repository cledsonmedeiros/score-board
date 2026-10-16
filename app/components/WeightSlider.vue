<template>
  <div class="flex items-center gap-2">
    <input
      type="range"
      :min="SKILL_MIN"
      :max="SKILL_MAX"
      :step="SKILL_STEP"
      :value="modelValue"
      :disabled="disabled"
      @input="
        $emit('update', Number(($event.target as HTMLInputElement).value))
      "
      class="h-2 w-24 cursor-pointer accent-blue-600 disabled:cursor-not-allowed
        sm:w-28"
    />
    <span
      class="w-9 shrink-0 text-right text-sm font-semibold tabular-nums
        text-gray-700"
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
