<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl md:p-6"
      @click.stop
    >
      <!-- Cabeçalho -->
      <div class="mb-4 flex items-center justify-between md:mb-6">
        <h2 class="text-xl font-bold text-gray-800 md:text-2xl">
          Selecionar Equipes
        </h2>
        <button
          @click="$emit('close')"
          class="flex h-8 w-8 items-center justify-center rounded-full
            text-gray-400 transition-colors hover:bg-gray-100
            hover:text-gray-600"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <!-- Aviso se não houver equipes -->
      <div
        v-if="store.availableTeams.length === 0"
        class="rounded-lg bg-yellow-50 p-4 text-center"
      >
        <p class="text-yellow-800">
          Nenhuma equipe disponível. Sortear equipes primeiro.
        </p>
      </div>

      <!-- Lista de Times -->
      <div v-else>
        <p class="mb-3 text-sm text-gray-600">
          Toque em um time para selecionar. Toque novamente para alternar a cor.
        </p>
        <div class="max-h-[60dvh] overflow-y-auto overflow-x-hidden pr-1">
          <div class="grid gap-2">
            <button
              v-for="(team, index) in store.availableTeams"
              :key="index"
              @click="handleTeamClick(team)"
              class="group relative w-full touch-manipulation rounded-lg border-2
                p-3 text-left transition-all active:scale-[0.98]"
              :class="[
                getTeamColor(team) === 'red'
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : getTeamColor(team) === 'blue'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              ]"
            >
              <!-- Indicador de cor -->
              <div
                v-if="getTeamColor(team)"
                class="absolute right-2 top-2 flex items-center gap-1"
              >
                <span
                  class="text-xs font-semibold"
                  :class="
                    getTeamColor(team) === 'red' ? 'text-red-700' : 'text-blue-700'
                  "
                >
                  {{ getTeamColor(team) === 'red' ? 'Vermelho' : 'Azul' }}
                </span>
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full"
                  :class="
                    getTeamColor(team) === 'red' ? 'bg-red-600' : 'bg-blue-600'
                  "
                >
                  <Icon name="heroicons:check" class="h-4 w-4 text-white" />
                </div>
              </div>

              <!-- Nome e contagem -->
              <div class="mb-2 flex items-baseline gap-2 pr-24">
                <span
                  class="text-base font-semibold"
                  :class="
                    getTeamColor(team) === 'red'
                      ? 'text-red-900'
                      : getTeamColor(team) === 'blue'
                        ? 'text-blue-900'
                        : 'text-gray-900'
                  "
                  >{{ team.name }}</span
                >
                <span class="text-xs text-gray-500">
                  {{ team.members.length }}
                  {{ team.members.length === 1 ? 'jogador' : 'jogadores' }}
                </span>
              </div>

              <!-- Membros -->
              <div class="flex flex-wrap gap-1.5">
                <PlayerBadge
                  v-for="member in team.members"
                  :key="member.id"
                  :player="member"
                  size="sm"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Botões -->
      <div class="mt-6 flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5
            font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          @click="handleConfirm"
          :disabled="store.availableTeams.length === 0"
          class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold
            text-white transition-colors hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Team, TeamColor } from '~/stores/scoreboard'

const store = useScoreboardStore()

const emit = defineEmits<{
  close: []
}>()

const localRedTeam = ref<Team | null>(null)
const localBlueTeam = ref<Team | null>(null)

// Inicializar com os times atuais comparando pelo nome
onMounted(() => {
  const currentRed = store.teams.red
  const currentBlue = store.teams.blue
  
  // Encontrar os times correspondentes em allTeams
  localRedTeam.value = store.allTeams.find(t => t.name === currentRed.name) || null
  localBlueTeam.value = store.allTeams.find(t => t.name === currentBlue.name) || null
})

// Retorna a cor do time comparando pelo nome
const getTeamColor = (team: Team): TeamColor | null => {
  if (localRedTeam.value && team.name === localRedTeam.value.name) return 'red'
  if (localBlueTeam.value && team.name === localBlueTeam.value.name) return 'blue'
  return null
}

const handleTeamClick = (team: Team) => {
  // Se o time clicado já é vermelho, troca para azul
  if (localRedTeam.value && team.name === localRedTeam.value.name) {
    const temp = localRedTeam.value
    localRedTeam.value = localBlueTeam.value
    localBlueTeam.value = temp
  }
  // Se o time clicado já é azul, troca para vermelho
  else if (localBlueTeam.value && team.name === localBlueTeam.value.name) {
    const temp = localBlueTeam.value
    localBlueTeam.value = localRedTeam.value
    localRedTeam.value = temp
  }
  // Se o time não está selecionado, seleciona como vermelho
  else {
    localRedTeam.value = team
  }
}

const handleConfirm = () => {
  if (localRedTeam.value) store.setSelectedTeam('red', localRedTeam.value)
  if (localBlueTeam.value) store.setSelectedTeam('blue', localBlueTeam.value)
  store.resetScores()
  emit('close')
}
</script>
