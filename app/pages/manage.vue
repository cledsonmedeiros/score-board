<template>
  <div class="flex h-screen flex-col">
    <!-- Header com navegação -->
    <header class="border-b bg-white shadow-sm">
      <div class="flex items-center justify-between p-3 md:p-4">
        <h1 class="text-lg font-bold text-gray-800 md:text-xl">
          Gerenciamento de Times
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
    <div class="flex flex-1 overflow-hidden">
      <PlayerManager />
    </div>

    <!-- Botão flutuante para sortear times -->
    <button
      v-if="store.enabledPlayers.length >= 2"
      @click="showDrawModal = true"
      class="fixed bottom-4 right-4 z-10 flex h-14 w-14 items-center
        justify-center rounded-full bg-green-600 text-white shadow-lg
        transition-all hover:scale-110 hover:bg-green-700 md:bottom-6
        md:right-6 md:h-16 md:w-16"
      title="Sortear Times"
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

// SEO
useHead({
  title: 'Gerenciamento de Jogadores - Score Board',
  meta: [
    {
      name: 'description',
      content: 'Gerencie jogadores, ajuste pesos por estrelas e sorteie times balanceados ou aleatórios. Sistema completo de gerenciamento de equipes.',
    },
    {
      name: 'keywords',
      content: 'gerenciamento, jogadores, times, sorteio, equipes, balanceamento, estrelas, peso',
    },
    // Open Graph
    {
      property: 'og:title',
      content: 'Gerenciamento de Jogadores - Score Board',
    },
    {
      property: 'og:description',
      content: 'Gerencie jogadores, ajuste pesos por estrelas e sorteie times balanceados ou aleatórios. Sistema completo de gerenciamento de equipes.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:image',
      content: '/icon-512x512.png',
    },
    {
      property: 'og:image:alt',
      content: 'Score Board - Gerenciamento de Jogadores',
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Gerenciamento de Jogadores - Score Board',
    },
    {
      name: 'twitter:description',
      content: 'Gerencie jogadores, ajuste pesos por estrelas e sorteie times balanceados ou aleatórios. Sistema completo de gerenciamento de equipes.',
    },
    {
      name: 'twitter:image',
      content: '/icon-512x512.png',
    },
  ],
})
</script>
