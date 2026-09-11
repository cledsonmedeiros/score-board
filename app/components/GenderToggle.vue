<template>
  <div
    class="inline-flex overflow-hidden rounded-lg border border-gray-300"
    role="group"
    aria-label="Gênero"
  >
    <button
      type="button"
      :disabled="disabled"
      @click="$emit('update', 'M')"
      class="font-semibold transition-colors disabled:cursor-not-allowed"
      :class="[
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        modelValue === 'M'
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50',
      ]"
      title="Masculino"
    >
      ♂ M
    </button>
    <button
      type="button"
      :disabled="disabled"
      @click="$emit('update', 'F')"
      class="border-l border-gray-300 font-semibold transition-colors
        disabled:cursor-not-allowed"
      :class="[
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        modelValue === 'F'
          ? 'bg-pink-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50',
      ]"
      title="Feminino"
    >
      ♀ F
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Gender } from '~/stores/scoreboard'

interface Props {
  modelValue: Gender
  disabled?: boolean
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
})

defineEmits<{
  update: [value: Gender]
}>()
</script>
