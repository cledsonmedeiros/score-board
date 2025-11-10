<template>
  <div
    class="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
  >
    <button
      @click="$emit('reset')"
      class="flex h-16 w-16 cursor-pointer items-center justify-center
        rounded-full border-4 border-white bg-gray-600 shadow-xl
        transition-all duration-200 hover:bg-gray-700"
    >
      <Icon name="heroicons:arrow-path" class="h-8 w-8 text-white" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  reset: []
}>()
</script>
