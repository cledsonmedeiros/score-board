<template>
  <div class="flex h-dvh w-screen select-none overflow-hidden">
    <!-- Botões de Ação -->
    <div
      class="absolute right-2 top-2 z-20 flex sm:right-4 sm:top-4
        portrait:flex-col portrait:gap-2 landscape:flex-row landscape:gap-2"
    >
      <!-- Botão de Gerenciamento -->
      <NuxtLink v-if="!socket.connected.value || socket.isHost.value" to="/manage">
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
        v-if="(!socket.connected.value || socket.isHost.value) && store.allTeams.length > 0"
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
        v-if="store.allTeams.length > 0"
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
        v-if="store.availableTeams.length > 2"
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
    <div class="flex h-dvh w-full portrait:flex-col landscape:flex-row">
      <!-- Equipe Vermelha -->
      <TeamScore color="red" />

      <!-- ScoreControl no Centro -->
      <ScaleTransition>
        <ScoreControl />
      </ScaleTransition>

      <!-- Equipe Azul -->
      <TeamScore color="blue" />
    </div>

    <!-- Modal de Sorteio -->
    <TeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="handleTeamsDrawn"
    />

    <!-- Modal de Visualização -->
    <ViewTeamsModal
      v-if="showViewModal"
      :teams="store.allTeams"
      @close="showViewModal = false"
    />

    <!-- Modal de Seleção de Equipes -->
    <TeamSelectorModal
      v-if="showSelectorModal"
      @close="showSelectorModal = false"
    />
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()
const socket = useSocket()
const router = useRouter()
const { isLandscape } = useOrientation()

const showDrawModal = ref(false)
const showViewModal = ref(false)
const showSelectorModal = ref(false)

const handleTeamsDrawn = async () => {
  // Aguarda a próxima atualização do DOM para garantir que o store foi atualizado
  await nextTick()
  
  // Sincroniza as equipes sorteadas com todos os participantes (se conectado)
  if (socket.connected.value && socket.isHost.value) {
    socket.syncTeams(store.teams, store.allTeams)
  }
  
  showDrawModal.value = false
}

onMounted(() => {
  socket.connect()

  // Setup Socket.IO event listeners para receber atualizações
  socket.onTeamsUpdated((data) => {
    store.teams = data.teams
    store.allTeams = data.allTeams
  })

  socket.onScoreUpdated((data) => {
    store.teams[data.color as 'red' | 'blue'].score = data.score
  })

  socket.onScoresReset(() => {
    store.teams.red.score = 0
    store.teams.blue.score = 0
  })

  socket.onRoomClosed((data) => {
    alert(data.message)
    router.push('/')
  })
})

// Watch para sincronizar scores com a sala (apenas se conectado)
watch(
  () => store.teams.red.score,
  (score) => {
    if (socket.connected.value) {
      socket.syncScore('red', score)
    }
  },
)

watch(
  () => store.teams.blue.score,
  (score) => {
    if (socket.connected.value) {
      socket.syncScore('blue', score)
    }
  },
)

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
</script>
