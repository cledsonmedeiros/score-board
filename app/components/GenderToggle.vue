<template>
  <UFieldGroup role="group" aria-label="Gênero">
    <UButton
      v-for="option in OPTIONS"
      :key="option.value"
      :size="size"
      :disabled="disabled"
      :color="modelValue === option.value ? option.color : 'neutral'"
      :variant="modelValue === option.value ? 'solid' : 'outline'"
      :aria-pressed="modelValue === option.value"
      :title="option.title"
      :label="option.label"
      @click="$emit('update', option.value)"
    />
  </UFieldGroup>
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

const OPTIONS = [
  { value: 'M', label: '♂ M', title: 'Masculino', color: 'primary' },
  { value: 'F', label: '♀ F', title: 'Feminino', color: 'secondary' },
] as const
</script>
