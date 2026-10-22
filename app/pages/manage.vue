<template>
  <div class="flex h-dvh flex-col">
    <!-- Header com navegação -->
    <header class="border-b bg-white shadow-xs">
      <div class="flex flex-col gap-3 p-3 md:p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-bold text-gray-800 md:text-xl">
            Gerenciamento de Equipes
          </h1>
          <div class="flex items-center gap-2">
            <!-- Desktop: ações visíveis -->
            <UButton
              class="hidden sm:inline-flex"
              color="neutral"
              variant="outline"
              icon="i-heroicons-qr-code"
              label="Importar/Exportar"
              title="Exportar ou importar jogadores"
              @click="showTransferModal = true"
            />
            <UButton
              class="hidden sm:inline-flex"
              color="error"
              variant="outline"
              icon="i-heroicons-trash"
              label="Limpar Tudo"
              title="Limpar todos os dados"
              @click="handleClearAll"
            />

            <!-- Celular: ações secundárias num menu -->
            <UDropdownMenu
              :items="secondaryActions"
              :content="{ align: 'end' }"
            >
              <UButton
                class="sm:hidden"
                color="neutral"
                variant="outline"
                icon="i-heroicons-ellipsis-vertical"
                aria-label="Mais ações"
              />
            </UDropdownMenu>

            <UButton
              to="/"
              icon="i-heroicons-chart-bar-square"
              label="Placar"
            />
          </div>
        </div>

        <!-- Botão de sortear integrado ao header -->
        <UButton
          v-if="store.enabledPlayers.length >= 2"
          block
          size="lg"
          color="success"
          icon="i-heroicons-user-group-solid"
          :label="`Sortear Equipes (${store.enabledPlayers.length} jogadores)`"
          @click="showDrawModal = true"
        />
      </div>
    </header>

    <!-- Conteúdo -->
    <div class="container mx-auto flex justify-center px-2 sm:px-4 md:px-6">
      <PlayerManager />
    </div>

    <!-- Modal de sorteio -->
    <LazyTeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="handleTeamsDrawn"
    />

    <LazyPlayerTransferModal
      v-if="showTransferModal"
      @close="showTransferModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const store = useScoreboardStore()
const showDrawModal = ref(false)
const showTransferModal = ref(false)
const { askConfirm } = usePrompt()

const secondaryActions: DropdownMenuItem[] = [
  {
    label: 'Importar/Exportar',
    icon: 'i-heroicons-qr-code',
    onSelect: () => (showTransferModal.value = true),
  },
  {
    label: 'Limpar Tudo',
    icon: 'i-heroicons-trash',
    color: 'error',
    onSelect: () => handleClearAll(),
  },
]

const handleTeamsDrawn = () => {
  // Redirecionar para a página do placar após sortear
  navigateTo('/')
}

const handleClearAll = async () => {
  const confirmed = await askConfirm({
    title: 'Limpar todos os dados?',
    message:
      'Isso irá remover:\n' +
      '• Todos os jogadores\n' +
      '• Todas as equipes formadas\n' +
      '• Todos os placares\n\n' +
      'Esta ação não pode ser desfeita!',
    confirmLabel: 'Limpar Tudo',
    cancelLabel: 'Cancelar',
    confirmTone: 'danger',
  })

  if (confirmed) {
    store.clearAllData()
  }
}
</script>
