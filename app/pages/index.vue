<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden select-none">
    <!-- Botões de Ação -->
    <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <!-- Botão de Gerenciamento -->
      <NuxtLink to="/manage">
        <button
          class="flex h-12 w-12 cursor-pointer items-center justify-center
            rounded-full bg-red-700 shadow-xl transition-colors hover:bg-red-800
            md:h-14 md:w-14"
        >
          <Icon
            name="heroicons:cog-6-tooth"
            class="h-7 w-7 text-white md:h-8 md:w-8"
          />
        </button>
      </NuxtLink>

      <!-- Botão de Refazer Sorteio -->
      <button
        v-if="store.teams[0]?.members && store.teams[0].members.length > 0"
        @click="showDrawModal = true"
        class="flex h-12 w-12 cursor-pointer items-center justify-center
          rounded-full bg-red-700 shadow-xl transition-colors hover:bg-red-800
          md:h-14 md:w-14"
        title="Refazer sorteio de times"
      >
        <Icon name="heroicons:arrow-path" class="h-7 w-7 text-white md:h-8 md:w-8" />
      </button>

      <!-- Botão de Ver Times -->
      <button
        v-if="store.teams[0]?.members && store.teams[0].members.length > 0"
        @click="showViewModal = true"
        class="flex h-12 w-12 cursor-pointer items-center justify-center
          rounded-full bg-red-700 shadow-xl transition-colors hover:bg-red-800
          md:h-14 md:w-14"
        title="Ver times atuais"
      >
        <Icon name="heroicons:eye" class="h-7 w-7 text-white md:h-8 md:w-8" />
      </button>

      <!-- Botão de Selecionar Times -->
      <button
        v-if="store.teams.filter(t => t.members.length > 0).length > 2"
        @click="showSelectorModal = true"
        class="flex h-12 w-12 cursor-pointer items-center justify-center
          rounded-full bg-red-700 shadow-xl transition-colors hover:bg-red-800
          md:h-14 md:w-14"
        title="Selecionar times para exibir"
      >
        <Icon name="heroicons:arrow-path-rounded-square" class="h-7 w-7 text-white md:h-8 md:w-8" />
      </button>
    </div>

    <!-- Equipe 1 -->
    <TeamScore
      v-if="store.teams[redTeamIndex]"
      :team-name="store.teams[redTeamIndex]!.name"
      :score="store.teams[redTeamIndex]!.score"
      :members="store.teams[redTeamIndex]!.members"
      position="top"
      bg-color="bg-red-500"
      button-bg-color="bg-red-700"
      button-hover-color="hover:bg-red-800"
      @increment="store.incrementTeamScore(redTeamIndex)"
      @decrement="store.decrementTeamScore(redTeamIndex)"
    />

    <!-- Botão Reset no Centro -->
    <ScaleTransition>
      <ResetButton
        v-if="
          store.teams[redTeamIndex] &&
          store.teams[blueTeamIndex] &&
          (store.teams[redTeamIndex]!.score > 0 || store.teams[blueTeamIndex]!.score > 0)
        "
        @reset="store.resetScores"
      />
    </ScaleTransition>

    <!-- Equipe 2 -->
    <TeamScore
      v-if="store.teams[blueTeamIndex]"
      :team-name="store.teams[blueTeamIndex]!.name"
      :score="store.teams[blueTeamIndex]!.score"
      :members="store.teams[blueTeamIndex]!.members"
      position="bottom"
      bg-color="bg-blue-500"
      button-bg-color="bg-blue-700"
      button-hover-color="hover:bg-blue-800"
      @increment="store.incrementTeamScore(blueTeamIndex)"
      @decrement="store.decrementTeamScore(blueTeamIndex)"
    />

    <!-- Modal de Sorteio -->
    <TeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="showDrawModal = false"
    />

    <!-- Modal de Visualização -->
    <ViewTeamsModal
      v-if="showViewModal"
      :teams="store.teams"
      @close="showViewModal = false"
    />

    <!-- Modal de Seleção de Times -->
    <TeamSelectorModal
      v-if="showSelectorModal"
      :teams="store.teams"
      :red-team-index="redTeamIndex"
      :blue-team-index="blueTeamIndex"
      @close="showSelectorModal = false"
      @confirm="handleTeamSelection"
    />
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()

const showDrawModal = ref(false)
const showViewModal = ref(false)
const showSelectorModal = ref(false)

const redTeamIndex = ref(0)
const blueTeamIndex = ref(1)

const handleTeamSelection = ({
  redTeamIndex: red,
  blueTeamIndex: blue,
}: {
  redTeamIndex: number
  blueTeamIndex: number
}) => {
  redTeamIndex.value = red
  blueTeamIndex.value = blue
  store.resetScores()
}

// SEO
useHead({
  title: 'Placar de Times - Score Board',
  meta: [
    {
      name: 'description',
      content: 'Acompanhe a pontuação dos times em tempo real. Sistema de placar digital para gerenciar e visualizar scores de equipes esportivas.',
    },
    {
      name: 'keywords',
      content: 'placar, score, times, equipes, pontuação, esportes, scoreboard, placar digital',
    },
    // Open Graph
    {
      property: 'og:title',
      content: 'Placar de Times - Score Board',
    },
    {
      property: 'og:description',
      content: 'Acompanhe a pontuação dos times em tempo real. Sistema de placar digital para gerenciar e visualizar scores de equipes esportivas.',
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
      content: 'Score Board - Placar de Times',
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Placar de Times - Score Board',
    },
    {
      name: 'twitter:description',
      content: 'Acompanhe a pontuação dos times em tempo real. Sistema de placar digital para gerenciar e visualizar scores de equipes esportivas.',
    },
    {
      name: 'twitter:image',
      content: '/icon-512x512.png',
    },
  ],
})
</script>
