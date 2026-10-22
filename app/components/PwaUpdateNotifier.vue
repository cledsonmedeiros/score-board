<template>
  <span hidden />
</template>

<script setup lang="ts">
/**
 * Quando o service worker encontra uma versão nova, mostra um aviso
 * persistente com o botão "Atualizar". Nada recarrega sem o clique.
 */
const { $pwa } = useNuxtApp()
const toast = useToast()

const TOAST_ID = 'pwa-update'

watch(
  () => $pwa?.needRefresh,
  (needRefresh) => {
    if (!needRefresh) return
    toast.add({
      id: TOAST_ID,
      title: 'Nova versão disponível',
      description: 'Atualize quando não estiver no meio de uma partida.',
      icon: 'i-heroicons-arrow-down-circle',
      color: 'primary',
      duration: 0,
      actions: [
        {
          label: 'Atualizar',
          color: 'primary',
          onClick: () => $pwa?.updateServiceWorker(),
        },
      ],
      'onUpdate:open': (open: boolean) => {
        // Fechou sem atualizar: a versão nova é aplicada ao reabrir o app.
        if (!open) $pwa?.cancelPrompt()
      },
    })
  },
  { immediate: true },
)
</script>
