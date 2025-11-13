<template>
  <div class="flex h-dvh flex-col">
    <!-- Header com navegação -->
    <header class="border-b bg-white shadow-sm">
      <div class="flex flex-col gap-3 p-3 md:p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-bold text-gray-800 md:text-xl">
            Gerenciamento de Equipes
          </h1>
          <div class="flex gap-2">
            <button
              @click="handleClearAll"
              class="flex items-center gap-1.5 rounded-lg border-2
                border-red-300 bg-white px-3 py-2 text-sm font-semibold
                text-red-600 shadow-sm transition-all hover:bg-red-50
                active:scale-95 active:bg-red-100"
              title="Limpar todos os dados"
            >
              <Icon name="heroicons:trash" class="h-4 w-4" />
              <span class="hidden sm:inline">Limpar Tudo</span>
            </button>
            <NuxtLink
              to="/"
              class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2
                text-sm font-semibold text-white shadow-sm transition-all
                hover:bg-blue-700 active:scale-95 active:bg-blue-800 md:px-4"
            >
              <Icon name="heroicons:chart-bar-square" class="h-4 w-4" />
              <span class="hidden sm:inline">Ir para </span>
              <span>Placar</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Botão de sortear integrado ao header -->
        <button
          v-if="store.enabledPlayers.length >= 2"
          @click="showDrawModal = true"
          class="flex w-full items-center justify-center gap-2 rounded-lg
            bg-green-600 px-4 py-3 text-sm font-semibold text-white
            shadow-sm transition-colors hover:bg-green-700 active:bg-green-800"
        >
          <Icon name="heroicons:user-group-solid" class="h-5 w-5" />
          <span>Sortear Equipes ({{ store.enabledPlayers.length }} jogadores)</span>
        </button>
      </div>
    </header>

    <!-- Conteúdo -->
    <div class="container mx-auto flex justify-center px-2 sm:px-4 md:px-6">
      <PlayerManager />
    </div>

    <!-- Modal de sorteio -->
    <TeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="handleTeamsDrawn"
    />
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()
const showDrawModal = ref(false)

const handleTeamsDrawn = () => {
  // Redirecionar para a página do placar após sortear
  navigateTo('/')
}

const handleClearAll = () => {
  const confirmed = confirm(
    'Tem certeza que deseja limpar TODOS os dados?\n\n' +
    'Isso irá remover:\n' +
    '• Todos os jogadores\n' +
    '• Todas as equipes formadas\n' +
    '• Todos os placares\n\n' +
    'Esta ação não pode ser desfeita!'
  )
  
  if (confirmed) {
    store.clearAllData()
  }
}
</script>
