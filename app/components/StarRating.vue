<template>
  <div class="flex items-center gap-0.5">
    <button
      v-for="star in 5"
      :key="star"
      @click="$emit('update', star)"
      type="button"
      :disabled="disabled"
      class="flex items-center justify-center transition-all focus:outline-none
        disabled:cursor-not-allowed active:scale-95"
      :class="[
        size === 'sm'
          ? 'h-8 w-8 touch-manipulation'
          : size === 'lg'
            ? 'h-12 w-12 touch-manipulation'
            : 'h-10 w-10 touch-manipulation',
        !disabled && 'hover:scale-110 active:bg-gray-100 rounded-lg',
      ]"
    >
      <Icon
        :name="star <= modelValue ? 'heroicons:star-solid' : 'heroicons:star'"
        :class="[
          size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6',
          star <= modelValue ? 'text-yellow-400' : 'text-gray-300',
        ]"
        class="transition-colors pointer-events-none"
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
