<template>
  <div class="flex items-center gap-2">
    <input
      type="range"
      min="1"
      max="5"
      step="0.5"
      :value="modelValue"
      :disabled="disabled"
      @input="
        $emit('update', Number(($event.target as HTMLInputElement).value))
      "
      class="h-2 w-24 cursor-pointer accent-blue-600 disabled:cursor-not-allowed
        sm:w-28"
    />
    <span
      class="w-7 shrink-0 text-right text-sm font-semibold tabular-nums
        text-gray-700"
    >
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup lang="ts">
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
