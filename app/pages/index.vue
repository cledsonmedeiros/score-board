<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden select-none">
    <!-- Botões de Ação -->
    <div class="absolute top-4 right-4 z-20 flex gap-2">
      <!-- Botão de Refazer Sorteio -->
      <button
        v-if="store.teams[0]?.members && store.teams[0].members.length > 0"
        @click="showDrawModal = true"
        class="flex items-center gap-2 rounded-lg bg-green-600/90 px-4 py-2
          text-sm font-semibold text-white shadow-lg backdrop-blur-sm
          transition-all hover:bg-green-600 hover:shadow-xl"
        title="Refazer sorteio de times"
      >
        <Icon name="heroicons:arrow-path" class="h-5 w-5" />
        <span class="hidden sm:inline">Refazer Sorteio</span>
      </button>

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
    </div>

    <!-- Equipe 1 -->
    <TeamScore
      v-if="store.teams[0]"
      :team-name="store.teams[0].name"
      :score="store.teams[0].score"
      :members="store.teams[0].members"
      position="top"
      bg-color="bg-red-500"
      button-bg-color="bg-red-700"
      button-hover-color="hover:bg-red-800"
      @increment="store.incrementTeamScore(0)"
      @decrement="store.decrementTeamScore(0)"
    />

    <!-- Botão Reset no Centro -->
    <ScaleTransition>
      <ResetButton
        v-if="
          store.teams[0] && store.teams[1] && (store.teams[0].score > 0 || store.teams[1].score > 0)
        "
        @reset="store.resetScores"
      />
    </ScaleTransition>

    <!-- Equipe 2 -->
    <TeamScore
      v-if="store.teams[1]"
      :team-name="store.teams[1].name"
      :score="store.teams[1].score"
      :members="store.teams[1].members"
      position="bottom"
      bg-color="bg-blue-500"
      button-bg-color="bg-blue-700"
      button-hover-color="hover:bg-blue-800"
      @increment="store.incrementTeamScore(1)"
      @decrement="store.decrementTeamScore(1)"
    />

    <!-- Modal de Sorteio -->
    <TeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="showDrawModal = false"
    />
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()

const showDrawModal = ref(false)
</script>
