<template>
  <UModal
    v-if="isDesktop"
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :ui="{ content: modalWidth[size], body: 'overflow-y-auto' }"
    @after:leave="emit('close')"
  >
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UModal>

  <UDrawer
    v-else
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :close="true"
    handle-only
    :ui="{ container: 'pb-[max(1rem,env(safe-area-inset-bottom))]' }"
    @after:leave="emit('close')"
  >
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

/**
 * Painel responsivo: sobe de baixo (drawer, com alça para arrastar) no
 * celular e vira modal centralizado a partir do breakpoint `md` (768px).
 *
 * Abre ao montar; ao ser fechado (X, Esc, toque fora ou arrastando), espera a
 * animação de saída e emite `close` — o pai continua usando `v-if` + `@close`.
 */
withDefaults(
  defineProps<{
    title: string
    description?: string
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    dismissible?: boolean
  }>(),
  { description: undefined, size: 'lg', dismissible: true },
)

const emit = defineEmits<{ close: [] }>()

const open = ref(true)
const isDesktop = useMediaQuery('(min-width: 768px)')

const modalWidth = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
} as const

/** Fecha com animação (o `close` sai depois, em `after:leave`). */
const close = () => {
  open.value = false
}

defineExpose({ close })
</script>
