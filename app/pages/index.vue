<template>
  <div class="flex h-dvh w-screen select-none overflow-hidden">
    <!-- PWA Update Prompt -->
    <PWAUpdatePrompt />

    <!-- Botões de Ação -->
    <div
      class="absolute right-2 top-2 z-20 flex sm:right-4 sm:top-4
        portrait:flex-col portrait:gap-2 landscape:flex-row landscape:gap-2"
    >
      <!-- Botão de Gerenciamento -->
      <NuxtLink to="/manage">
        <button
          :class="[
            `flex h-10 w-10 cursor-pointer items-center justify-center
            rounded-full shadow-xl transition-colors sm:h-12 sm:w-12 md:h-14
            md:w-14`,
            isLandscape
              ? 'bg-blue-700 hover:bg-blue-800'
              : 'bg-red-700 hover:bg-red-800',
          ]"
        >
          <Icon
            name="heroicons:cog-6-tooth"
            class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
          />
        </button>
      </NuxtLink>

      <!-- Botão de Refazer Sorteio -->
      <button
        v-if="store.teams[0]?.members && store.teams[0].members.length > 0"
        @click="showDrawModal = true"
        :class="[
          `flex h-10 w-10 cursor-pointer items-center justify-center
          rounded-full shadow-xl transition-colors sm:h-12 sm:w-12 md:h-14
          md:w-14`,
          isLandscape
            ? 'bg-blue-700 hover:bg-blue-800'
            : 'bg-red-700 hover:bg-red-800',
        ]"
        title="Refazer sorteio de equipes"
      >
        <Icon
          name="heroicons:arrow-path"
          class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
        />
      </button>

      <!-- Botão de Ver Equipes -->
      <button
        v-if="store.teams[0]?.members && store.teams[0].members.length > 0"
        @click="showViewModal = true"
        :class="[
          `flex h-10 w-10 cursor-pointer items-center justify-center
          rounded-full shadow-xl transition-colors sm:h-12 sm:w-12 md:h-14
          md:w-14`,
          isLandscape
            ? 'bg-blue-700 hover:bg-blue-800'
            : 'bg-red-700 hover:bg-red-800',
        ]"
        title="Ver equipes atuais"
      >
        <Icon
          name="heroicons:eye"
          class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
        />
      </button>

      <!-- Botão de Selecionar Equipes -->
      <button
        v-if="store.teams.filter((t) => t.members.length > 0).length > 2"
        @click="showSelectorModal = true"
        :class="[
          `flex h-10 w-10 cursor-pointer items-center justify-center
          rounded-full shadow-xl transition-colors sm:h-12 sm:w-12 md:h-14
          md:w-14`,
          isLandscape
            ? 'bg-blue-700 hover:bg-blue-800'
            : 'bg-red-700 hover:bg-red-800',
        ]"
        title="Selecionar equipes para exibir"
      >
        <Icon
          name="heroicons:arrow-path-rounded-square"
          class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
        />
      </button>
    </div>

    <!-- Container dos Placares -->
    <div class="flex h-full w-full portrait:flex-col landscape:flex-row">
      <!-- Equipe 1 -->
      <TeamScore
        v-if="store.teams[redTeamIndex]"
        :team-name="store.teams[redTeamIndex]!.name"
        :score="store.teams[redTeamIndex]!.score"
        :members="store.teams[redTeamIndex]!.members"
        :position="isLandscape ? 'left' : 'top'"
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
            (store.teams[redTeamIndex]!.score > 0 ||
              store.teams[blueTeamIndex]!.score > 0)
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
        :position="isLandscape ? 'right' : 'bottom'"
        bg-color="bg-blue-500"
        button-bg-color="bg-blue-700"
        button-hover-color="hover:bg-blue-800"
        @increment="store.incrementTeamScore(blueTeamIndex)"
        @decrement="store.decrementTeamScore(blueTeamIndex)"
      />
    </div>

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

    <!-- Modal de Seleção de Equipes -->
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
const { isLandscape } = useOrientation()

const showDrawModal = ref(false)
const showViewModal = ref(false)
const showSelectorModal = ref(false)

const redTeamIndex = ref(0)
const blueTeamIndex = ref(1)

// Atualiza a cor do tema dinamicamente baseado na orientação
watch(
  isLandscape,
  (landscape) => {
    if (import.meta.client) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          landscape ? '#3B82F6' : '#EF4444',
        )
      }
    }
  },
  { immediate: true },
)

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
</script>
