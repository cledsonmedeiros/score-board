<template>
  <div class="flex h-dvh flex-col">
    <!-- Header com navegação -->
    <header class="border-b bg-white shadow-sm">
      <div class="flex items-center justify-between p-3 md:p-4">
        <h1 class="text-lg font-bold text-gray-800 md:text-xl">
          Gerenciamento de Equipes
        </h1>
        <NuxtLink
          to="/"
          class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold
            text-white transition-colors hover:bg-blue-700 md:px-4"
        >
          <span class="hidden sm:inline">Ir para </span>Placar
        </NuxtLink>
      </div>
    </header>

    <!-- Conteúdo -->
    <div class="container mx-auto flex justify-center px-2 sm:px-4 md:px-6">
      <PlayerManager />
    </div>

    <!-- Botão flutuante para sortear equipes -->
    <button
      v-if="store.enabledPlayers.length >= 2"
      @click="showDrawModal = true"
      class="fixed bottom-4 right-4 z-10 flex h-14 w-14 items-center
        justify-center rounded-full bg-green-600 text-white shadow-lg
        transition-all hover:scale-110 hover:bg-green-700 md:bottom-6 md:right-6
        md:h-16 md:w-16"
      title="Sortear equipes"
    >
      <Icon name="heroicons:user-group" class="h-8 w-8" />
    </button>

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
</script>
