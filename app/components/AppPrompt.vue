<template>
  <div
    v-if="request"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    @click.self="handleBackdrop"
  >
    <div
      class="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl md:p-6"
      @click.stop
    >
      <h3 class="text-lg font-bold text-gray-800 md:text-xl">
        {{ request.title }}
      </h3>

      <p
        v-if="request.message"
        class="mt-2 whitespace-pre-line text-sm text-gray-600"
      >
        {{ request.message }}
      </p>

      <div class="mt-5 flex flex-col gap-2">
        <button
          v-for="option in request.options"
          :key="option.value"
          @click="resolvePrompt(option.value)"
          class="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          :class="getOptionClass(option.tone)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PromptOption } from '~/composables/usePrompt'

const { request, resolvePrompt } = usePrompt()

const handleBackdrop = () => {
  if (!request.value?.closeOnBackdrop) {
    return
  }

  resolvePrompt(request.value.closeValue ?? null)
}

const getOptionClass = (tone: PromptOption['tone']) => {
  if (tone === 'danger') {
    return 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
  }

  if (tone === 'primary') {
    return 'bg-blue-600 text-white hover:bg-blue-700'
  }

  return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
}
</script>
