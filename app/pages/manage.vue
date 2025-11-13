<template>
  <div class="flex h-dvh flex-col">
    <!-- Header com navegação -->
    <header class="border-b bg-white shadow-sm">
      <div class="flex flex-col gap-3 p-3 md:p-4">
        <!-- Informação da Sala -->
        <div
          v-if="socket.roomCode.value"
          class="rounded-lg bg-blue-50 p-3 text-center"
        >
          <p class="mb-1 text-xs font-medium text-blue-600">
            {{ socket.isHost.value ? '🎮 Sua Sala' : '👥 Participando' }}
          </p>
          <p class="mb-2 text-2xl font-black tracking-wider text-blue-700">
            {{ socket.roomCode.value }}
          </p>
          <div class="flex items-center justify-center gap-2">
            <button
              @click="copyRoomLink"
              class="flex items-center gap-1 rounded bg-blue-600 px-3 py-1
                text-xs font-semibold text-white transition-colors
                hover:bg-blue-700"
            >
              <Icon name="heroicons:link" class="h-3 w-3" />
              {{ copied ? 'Copiado!' : 'Copiar Link' }}
            </button>
            <button
              @click="handleLeaveRoom"
              class="flex items-center gap-1 rounded bg-red-600 px-3 py-1
                text-xs font-semibold text-white transition-colors
                hover:bg-red-700"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="h-3 w-3" />
              Sair
            </button>
          </div>
          <p
            v-if="socket.participants.value.length > 1"
            class="mt-2 text-xs text-blue-600"
          >
            {{ socket.participants.value.length }} pessoas conectadas
          </p>
        </div>

        <div class="flex items-center justify-between">
          <h1 class="text-lg font-bold text-gray-800 md:text-xl">
            Gerenciamento de Equipes
          </h1>
          <div class="flex gap-2">
            <button
              v-if="socket.isHost.value"
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
            <button
              @click="handleGoToScoreboard"
              class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2
                text-sm font-semibold text-white shadow-sm transition-all
                hover:bg-blue-700 active:scale-95 active:bg-blue-800 md:px-4"
            >
              <Icon name="heroicons:chart-bar-square" class="h-4 w-4" />
              <span class="hidden sm:inline">Ir para </span>
              <span>Placar</span>
            </button>
          </div>
        </div>

        <!-- Botão de sortear integrado ao header -->
        <button
          v-if="socket.isHost.value && store.enabledPlayers.length >= 2"
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
const socket = useSocket()
const router = useRouter()
const config = useRuntimeConfig()

const showDrawModal = ref(false)
const copied = ref(false)

onMounted(() => {
  socket.connect()

  // Setup Socket.IO event listeners
  socket.onParticipantJoined(() => {
    console.log('New participant joined')
  })

  socket.onRoomClosed((data) => {
    alert(data.message)
    router.push('/')
  })

  // Redireciona se não estiver em uma sala
  if (!socket.roomCode.value) {
    router.push('/')
  }
})

// Watch para sincronizar players com a sala
watch(
  () => store.players,
  (players) => {
    if (socket.isHost.value) {
      socket.syncPlayers(players)
    }
  },
  { deep: true },
)

const handleTeamsDrawn = () => {
  // Sincroniza as equipes sorteadas com todos os participantes
  if (socket.isHost.value) {
    socket.syncTeams(store.teams, store.allTeams)
  }
  router.push('/scoreboard')
}

const handleClearAll = () => {
  const confirmed = confirm(
    'Tem certeza que deseja limpar TODOS os dados?\n\n' +
      'Isso irá remover:\n' +
      '• Todos os jogadores\n' +
      '• Todas as equipes formadas\n' +
      '• Todos os placares\n\n' +
      'Esta ação não pode ser desfeita!',
  )

  if (confirmed) {
    store.clearAllData()
  }
}

const handleGoToScoreboard = () => {
  router.push('/scoreboard')
}

const copyRoomLink = async () => {
  const link = `${window.location.origin}/?room=${socket.roomCode.value}`

  try {
    await navigator.clipboard.writeText(link)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Erro ao copiar link:', err)
  }
}

const handleLeaveRoom = () => {
  const confirmed = confirm(
    socket.isHost.value
      ? 'Você é o host. Se sair, a sala será encerrada para todos. Deseja continuar?'
      : 'Deseja sair da sala?',
  )

  if (confirmed) {
    socket.leaveRoom()
    router.push('/')
  }
}
</script>
