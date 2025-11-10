<template>
  <div class="flex items-center gap-1">
    <button
      v-for="star in 5"
      :key="star"
      @click="$emit('update', star)"
      type="button"
      :disabled="disabled"
      class="transition-all focus:outline-none disabled:cursor-not-allowed"
      :class="[
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6',
        star <= modelValue ? 'text-yellow-400' : 'text-gray-300',
        !disabled && 'hover:scale-110',
      ]"
    >
      <Icon
        :name="star <= modelValue ? 'heroicons:star-solid' : 'heroicons:star'"
        class="h-full w-full transition-colors"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
})

defineEmits<{
  update: [value: number]
}>()
</script>
