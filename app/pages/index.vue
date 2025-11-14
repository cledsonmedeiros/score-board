<template>
  <div
    class="flex min-h-dvh flex-col items-center justify-center
      bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4"
  >
    <div class="w-full max-w-md space-y-6">
      <!-- Logo/Título -->
      <div class="text-center">
        <h1
          class="mb-2 text-5xl font-black text-white drop-shadow-2xl
            md:text-6xl"
        >
          ScoreBoard
        </h1>
        <p class="text-lg text-white/90 drop-shadow-lg">
          Salas interativas em tempo real
        </p>
      </div>

      <!-- Card Principal -->
      <div
        class="rounded-2xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-8"
      >
        <!-- Criar Sala -->
        <div v-if="!isJoining" class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              Seu Nome
            </label>
            <input
              v-model="hostName"
              type="text"
              placeholder="Digite seu nome"
              class="w-full rounded-lg border-2 border-gray-300 px-4 py-3
                text-lg transition-colors focus:border-blue-500
                focus:outline-none"
              @keyup.enter="handleCreateRoom"
            />
          </div>

          <button
            @click="handleCreateRoom"
            :disabled="!hostName.trim() || isLoading"
            class="flex w-full items-center justify-center gap-2 rounded-lg
              bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-lg
              font-bold text-white shadow-lg transition-all
              hover:from-blue-700 hover:to-purple-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              v-if="!isLoading"
              name="heroicons:plus-circle"
              class="h-6 w-6"
            />
            <Icon v-else name="svg-spinners:ring-resize" class="h-6 w-6" />
            <span>{{ isLoading ? 'Criando...' : 'Criar Sala' }}</span>
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t-2 border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-4 font-medium text-gray-500">ou</span>
            </div>
          </div>

          <button
            @click="isJoining = true"
            class="flex w-full items-center justify-center gap-2 rounded-lg
              border-2 border-gray-300 bg-white px-6 py-4 text-lg font-semibold
              text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="h-6 w-6" />
            <span>Entrar em uma Sala</span>
          </button>
        </div>

        <!-- Entrar na Sala -->
        <div v-else class="space-y-4">
          <button
            @click="isJoining = false"
            class="mb-2 flex items-center gap-1 text-sm text-gray-600
              hover:text-gray-800"
          >
            <Icon name="heroicons:arrow-left" class="h-4 w-4" />
            Voltar
          </button>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              Código da Sala
            </label>
            <input
              v-model="joinCode"
              type="text"
              placeholder="Ex: ABC123"
              class="w-full rounded-lg border-2 border-gray-300 px-4 py-3
                text-center text-2xl font-bold uppercase tracking-widest
                transition-colors focus:border-blue-500 focus:outline-none"
              maxlength="6"
              @input="joinCode = joinCode.toUpperCase()"
              @keyup.enter="handleJoinRoom"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              Seu Nome
            </label>
            <input
              v-model="participantName"
              type="text"
              placeholder="Digite seu nome"
              class="w-full rounded-lg border-2 border-gray-300 px-4 py-3
                text-lg transition-colors focus:border-blue-500
                focus:outline-none"
              @keyup.enter="handleJoinRoom"
            />
          </div>

          <button
            @click="handleJoinRoom"
            :disabled="
              !joinCode.trim() || !participantName.trim() || isLoading
            "
            class="flex w-full items-center justify-center gap-2 rounded-lg
              bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-lg
              font-bold text-white shadow-lg transition-all
              hover:from-green-700 hover:to-teal-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              v-if="!isLoading"
              name="heroicons:arrow-right-circle"
              class="h-6 w-6"
            />
            <Icon v-else name="svg-spinners:ring-resize" class="h-6 w-6" />
            <span>{{ isLoading ? 'Entrando...' : 'Entrar na Sala' }}</span>
          </button>

          <p
            v-if="error"
            class="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600"
          >
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Info -->
      <div
        class="rounded-xl bg-white/20 p-4 text-center text-sm text-white
          backdrop-blur-sm"
      >
        <p class="font-medium">
          💡 Crie uma sala e compartilhe o link com seus amigos!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const socket = useSocket()

const isJoining = ref(false)
const isLoading = ref(false)
const error = ref('')

const hostName = ref('')
const joinCode = ref('')
const participantName = ref('')

// Se veio com código na URL, abre o modo de entrada automaticamente
onMounted(() => {
  socket.connect()

  const urlCode = route.query.room as string
  if (urlCode) {
    joinCode.value = urlCode.toUpperCase()
    isJoining.value = true
  }
})

const handleCreateRoom = async () => {
  if (!hostName.value.trim()) return

  isLoading.value = true
  error.value = ''

  try {
    await socket.createRoom(hostName.value.trim())
    await router.push('/manage')
  } catch (err: any) {
    error.value = err.message || 'Erro ao criar sala'
  } finally {
    isLoading.value = false
  }
}

const handleJoinRoom = async () => {
  if (!joinCode.value.trim() || !participantName.value.trim()) return

  isLoading.value = true
  error.value = ''

  try {
    const roomData = await socket.joinRoom(
      joinCode.value.trim(),
      participantName.value.trim(),
    )

    const store = useScoreboardStore()
    store.players = roomData.players
    store.teams = roomData.teams
    store.allTeams = roomData.allTeams

    await router.push('/scoreboard')
  } catch (err: any) {
    error.value = err.message || 'Erro ao entrar na sala'
  } finally {
    isLoading.value = false
  }
}
</script>
