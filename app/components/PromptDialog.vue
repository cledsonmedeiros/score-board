<template>
  <UModal
    :title="title"
    :description="message"
    :dismissible="closeOnBackdrop"
    :close="false"
    :ui="{ footer: 'flex-col gap-2', description: 'whitespace-pre-line' }"
    @update:open="(open: boolean) => !open && emit('close', closeValue)"
  >
    <template #footer>
      <UButton
        v-for="option in options"
        :key="option.value"
        block
        size="lg"
        v-bind="toneProps(option.tone)"
        :label="option.label"
        @click="emit('close', option.value)"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PromptOption } from '~/composables/usePrompt'

withDefaults(
  defineProps<{
    title: string
    message?: string
    options: PromptOption[]
    closeOnBackdrop?: boolean
    closeValue?: string | null
  }>(),
  { message: undefined, closeOnBackdrop: true, closeValue: null },
)

const emit = defineEmits<{ close: [value: string | null] }>()

const toneProps = (tone: PromptOption['tone']) => {
  if (tone === 'danger') return { color: 'error', variant: 'soft' } as const
  if (tone === 'primary') return { color: 'primary', variant: 'solid' } as const
  return { color: 'neutral', variant: 'outline' } as const
}
</script>
