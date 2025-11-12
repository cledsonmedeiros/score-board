<template>
  <div class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
    <button
      @click="$emit('reset')"
      class="flex h-12 w-12 cursor-pointer items-center justify-center
        rounded-full border-4 border-white bg-gray-600 shadow-xl transition-all
        duration-200 hover:bg-gray-700 sm:h-16 sm:w-16 landscape:h-14
        landscape:w-14"
    >
      <Icon
        name="heroicons:arrow-path"
        class="h-6 w-6 text-white sm:h-8 sm:w-8 landscape:h-7 landscape:w-7"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  reset: []
}>()
</script>
