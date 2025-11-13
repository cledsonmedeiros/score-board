<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white
        p-4 shadow-2xl md:p-6"
      @click.stop
    >
      <!-- Cabeçalho -->
      <div class="mb-4 md:mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800 md:text-2xl">
            {{ creationMode === 'auto' ? 'Sortear Equipes' : 'Montar Equipes' }}
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

        <!-- Modo de Criação -->
        <div v-if="!showPreview" class="flex gap-2">
          <button
            @click="creationMode = 'auto'"
            class="flex-1 rounded-lg border-2 px-4 py-2 text-sm font-semibold
              transition-colors"
            :class="
              creationMode === 'auto'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            "
          >
            🎲 Sorteio
          </button>
          <button
            @click="switchToManualMode"
            class="flex-1 rounded-lg border-2 px-4 py-2 text-sm font-semibold
              transition-colors"
            :class="
              creationMode === 'manual'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            "
          >
            ✋ Manual
          </button>
        </div>
      </div>

      <!-- Aviso se não houver jogadores -->
      <div
        v-if="store.enabledPlayers.length === 0"
        class="rounded-lg bg-yellow-50 p-4 text-center"
      >
        <p class="text-yellow-800">
          Nenhum jogador habilitado para sorteio. Adicione e habilite jogadores
          primeiro.
        </p>
      </div>

      <!-- Preview das Equipes Sorteadas -->
      <div v-else-if="showPreview && previewTeams">
        <!-- Lista de Equipes -->
        <div class="mb-4 grid gap-3 md:grid-cols-2">
          <div
            v-for="(team, index) in previewTeams"
            :key="index"
            class="flex min-h-40 flex-col rounded-lg border-2 p-3"
            :class="
              index === 0
                ? 'border-red-300 bg-red-50'
                : index === 1
                  ? 'border-blue-300 bg-blue-50'
                  : index === 2
                    ? 'border-green-300 bg-green-50'
                    : index === 3
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-purple-300 bg-purple-50'
            "
          >
            <h3
              class="mb-2 text-base font-bold"
              :class="
                index === 0
                  ? 'text-red-800'
                  : index === 1
                    ? 'text-blue-800'
                    : index === 2
                      ? 'text-green-800'
                      : index === 3
                        ? 'text-yellow-800'
                        : 'text-purple-800'
              "
            >
              {{ team.name }}
            </h3>
            <div class="mb-2 grid flex-1 grid-cols-2 content-start gap-2">
              <PlayerBadge
                v-for="member in team.members"
                :key="member.id"
                :player="member"
                layout="vertical"
              />
            </div>
            <!-- Info da Equipe -->
            <div
              class="mt-auto flex items-center gap-3 border-t border-gray-200
                pt-2 text-xs text-gray-600"
            >
              <span
                >👥 {{ team.members.length }}
                {{ team.members.length === 1 ? 'jogador' : 'jogadores' }}</span
              >
              <span
                >⚖️
                {{
                  team.members.reduce((sum, m) => sum + m.weight, 0).toFixed(1)
                }}</span
              >
            </div>
          </div>
        </div>

        <!-- Botões de Ação do Preview -->
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <button
              @click="redrawTeams"
              class="flex-1 rounded-lg border border-orange-300 bg-orange-50
                px-4 py-2.5 font-semibold text-orange-700 transition-colors
                hover:bg-orange-100"
            >
              🔄 Sortear Novamente
            </button>
            <button
              @click="confirmTeams"
              class="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-semibold
                text-white transition-colors hover:bg-green-700"
            >
              ✓ Confirmar Equipes
            </button>
          </div>
          <button
            @click="backToConfig"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5
              font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <!-- Configuração do Sorteio -->
      <div v-else-if="creationMode === 'auto'">
        <!-- Info de jogadores -->
        <div class="mb-6 rounded-lg bg-blue-50 p-4">
          <p class="text-sm text-blue-800">
            <span class="font-semibold">{{ store.enabledPlayers.length }}</span>
            {{
              store.enabledPlayers.length === 1
                ? 'jogador habilitado'
                : 'jogadores habilitados'
            }}
            para sorteio
          </p>
        </div>

        <!-- Configurações -->
        <div class="mb-6 space-y-4">
          <!-- Número de jogadores por equipe -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700"
              >Jogadores por Equipe</label
            >
            <input
              v-model.number="playersPerTeam"
              type="number"
              min="1"
              :max="Math.ceil(store.enabledPlayers.length / 2)"
              class="w-full rounded-lg border border-gray-300 px-4 py-2
                focus:border-blue-500 focus:outline-none focus:ring-2
                focus:ring-blue-500"
            />
            <p class="mt-1 text-xs text-gray-500">
              Mínimo: 1 | Máximo:
              {{ Math.ceil(store.enabledPlayers.length / 2) }}
              <span
                v-if="calculatedTeams > 0"
                class="font-semibold text-blue-600"
              >
                | Serão criadas {{ calculatedTeams }}
                {{ calculatedTeams === 1 ? 'equipe' : 'equipes' }}
              </span>
            </p>
          </div>

          <!-- Tipo de sorteio -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700"
              >Tipo de Sorteio</label
            >
            <div class="flex flex-col gap-3 md:flex-row md:gap-4">
              <label
                class="flex flex-1 cursor-pointer items-center gap-3 rounded-lg
                  border-2 p-3 transition-colors md:p-4"
                :class="
                  drawType === 'balanced'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                "
              >
                <input
                  v-model="drawType"
                  type="radio"
                  value="balanced"
                  class="h-4 w-4 text-blue-600"
                />
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Balanceado</p>
                  <p class="text-xs text-gray-600">
                    Distribui jogadores balanceando por peso
                  </p>
                </div>
              </label>

              <label
                class="flex flex-1 cursor-pointer items-center gap-3 rounded-lg
                  border-2 p-3 transition-colors md:p-4"
                :class="
                  drawType === 'random'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                "
              >
                <input
                  v-model="drawType"
                  type="radio"
                  value="random"
                  class="h-4 w-4 text-blue-600"
                />
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Aleatório</p>
                  <p class="text-xs text-gray-600">
                    Distribui jogadores de forma aleatória
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Preview dos jogadores -->
        <div class="mb-6">
          <h3 class="mb-3 text-sm font-medium text-gray-700">
            Jogadores no Sorteio
          </h3>
          <div class="max-h-48 overflow-y-auto rounded-lg border p-4">
            <div class="flex flex-wrap gap-2">
              <PlayerBadge
                v-for="player in store.enabledPlayers"
                :key="player.id"
                :player="player"
              />
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex flex-col gap-3 md:flex-row">
          <button
            @click="$emit('close')"
            class="flex-1 rounded-lg border border-gray-300 px-6 py-3
              font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="handleDraw"
            :disabled="
              playersPerTeam < 1 || playersPerTeam > store.enabledPlayers.length
            "
            class="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold
              text-white transition-colors hover:bg-blue-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sortear Equipes
          </button>
        </div>
      </div>

      <!-- Modo Manual -->
      <div v-else>
        <!-- Info sobre edição -->
        <div
          v-if="store.allTeams.length > 0"
          class="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
        >
          <div class="flex items-start gap-2">
            <Icon name="heroicons:pencil-square" class="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p class="font-semibold">Modo de Edição</p>
              <p class="text-xs">
                As equipes atuais foram carregadas. Você pode adicionar/remover
                jogadores ou criar novas equipes.
              </p>
            </div>
          </div>
        </div>

        <!-- Controles de Equipes -->
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-gray-600">
            {{ manualTeams.length }}
            {{ manualTeams.length === 1 ? 'equipe' : 'equipes' }}
          </p>
          <div class="flex gap-2">
            <button
              v-if="store.allTeams.length > 0"
              @click="resetManualTeams"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5
                text-sm font-semibold text-gray-700 transition-colors
                hover:bg-gray-50"
              title="Começar do zero"
            >
              <Icon name="heroicons:arrow-path" class="inline h-4 w-4" />
              Resetar
            </button>
            <button
              @click="addManualTeam"
              :disabled="manualTeams.length >= 5"
              class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5
                text-sm font-semibold text-blue-700 transition-colors
                hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="heroicons:plus" class="inline h-4 w-4" />
              Adicionar Equipe
            </button>
          </div>
        </div>

        <!-- Pool de Jogadores Não Alocados -->
        <div class="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-3">
          <h3 class="mb-2 text-sm font-medium text-gray-700">
            Jogadores Disponíveis ({{ unassignedPlayers.length }})
          </h3>
          <div
            v-if="unassignedPlayers.length > 0"
            class="flex flex-wrap gap-2"
          >
            <button
              v-for="player in unassignedPlayers"
              :key="player.id"
              @click="openTeamSelectionModal(player)"
              class="cursor-pointer transition-transform hover:scale-105"
            >
              <PlayerBadge :player="player" />
            </button>
          </div>
          <p v-else class="text-sm text-gray-500">
            Todos os jogadores foram alocados
          </p>
        </div>

        <!-- Equipes Manuais -->
        <div class="mb-4 max-h-96 space-y-3 overflow-y-auto">
          <div
            v-for="(team, index) in manualTeams"
            :key="index"
            class="flex flex-col rounded-lg border-2 p-3"
            :class="getTeamColorClasses(index)"
          >
            <div class="mb-2 flex items-center justify-between">
              <input
                v-model="team.name"
                type="text"
                class="flex-1 rounded border-none bg-transparent text-base
                  font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="getTeamTextColor(index)"
                placeholder="Nome da Equipe"
              />
              <button
                @click="removeManualTeam(index)"
                :disabled="manualTeams.length <= 2"
                class="ml-2 rounded p-1 text-gray-400 transition-colors
                  hover:bg-white/50 hover:text-red-600
                  disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="heroicons:trash" class="h-4 w-4" />
              </button>
            </div>

            <div
              class="mb-2 min-h-20 rounded border-2 border-dashed
                p-2"
              :class="'border-gray-300 bg-white/30'"
            >
              <div v-if="team.members.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="member in team.members"
                  :key="member.id"
                  class="group relative"
                >
                  <PlayerBadge :player="member" />
                  <button
                    @click.stop="removePlayerFromTeam(index, member.id)"
                    class="absolute -right-1 -top-1 flex h-5 w-5 items-center
                      justify-center rounded-full bg-red-500 text-white opacity-0
                      shadow-lg transition-opacity group-hover:opacity-100"
                  >
                    <Icon name="heroicons:x-mark" class="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p
                v-else
                class="text-center text-sm text-gray-500"
              >
                Nenhum jogador
              </p>
            </div>

            <!-- Info da Equipe -->
            <div
              class="flex items-center gap-3 border-t border-gray-200 pt-2
                text-xs text-gray-600"
            >
              <span
                >👥 {{ team.members.length }}
                {{ team.members.length === 1 ? 'jogador' : 'jogadores' }}</span
              >
              <span
                >⚖️
                {{
                  team.members.reduce((sum, m) => sum + m.weight, 0).toFixed(1)
                }}</span
              >
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex flex-col gap-3 md:flex-row">
          <button
            @click="$emit('close')"
            class="flex-1 rounded-lg border border-gray-300 px-6 py-3
              font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="confirmManualTeams"
            :disabled="!canConfirmManualTeams"
            class="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold
              text-white transition-colors hover:bg-green-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✓ Confirmar Equipes
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Seleção de Equipe -->
    <div
      v-if="showTeamSelectionModal && playerToAssign"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      @click.self="closeTeamSelectionModal"
    >
      <div
        class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        @click.stop
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800">
            Escolha a Equipe
          </h3>
          <button
            @click="closeTeamSelectionModal"
            class="flex h-8 w-8 items-center justify-center rounded-full
              text-gray-400 transition-colors hover:bg-gray-100
              hover:text-gray-600"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </div>

        <div class="mb-4 rounded-lg bg-blue-50 p-3">
          <PlayerBadge :player="playerToAssign" layout="horizontal" />
        </div>

        <div class="space-y-2">
          <button
            v-for="(team, index) in manualTeams"
            :key="index"
            @click="assignPlayerToTeamFromModal(index)"
            class="flex w-full items-center justify-between rounded-lg border-2
              p-3 transition-colors hover:bg-gray-50"
            :class="getTeamColorClasses(index)"
          >
            <div>
              <p class="font-semibold" :class="getTeamTextColor(index)">
                {{ team.name }}
              </p>
              <p class="text-xs text-gray-600">
                {{ team.members.length }}
                {{ team.members.length === 1 ? 'jogador' : 'jogadores' }} ·
                Peso: {{ team.members.reduce((sum, m) => sum + m.weight, 0).toFixed(1) }}
              </p>
            </div>
            <Icon name="heroicons:arrow-right" class="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Team, Player } from '~/stores/scoreboard'

const emit = defineEmits<{
  close: []
  drawn: []
}>()

const store = useScoreboardStore()

// Modo de criação: 'auto' (sorteio) ou 'manual'
const creationMode = ref<'auto' | 'manual'>('auto')

// Estados do modo automático
const playersPerTeam = ref(4)
const drawType = ref<'balanced' | 'random'>('balanced')
const previewTeams = ref<Team[] | null>(null)
const showPreview = ref(false)

// Estados do modo manual
const manualTeams = ref<Team[]>([])
const selectedPlayer = ref<Player | null>(null)
const showTeamSelectionModal = ref(false)
const playerToAssign = ref<Player | null>(null)

const calculatedTeams = computed(() => {
  if (playersPerTeam.value < 1) return 0

  let numberOfTeams = Math.ceil(
    store.enabledPlayers.length / playersPerTeam.value,
  )
  const remainder = store.enabledPlayers.length % playersPerTeam.value

  // Se sobrar apenas 1 jogador, mesclar com o penúltimo time
  if (remainder === 1 && numberOfTeams > 1) {
    numberOfTeams = numberOfTeams - 1
  }

  return numberOfTeams
})

// Jogadores não alocados no modo manual
const unassignedPlayers = computed(() => {
  const assignedIds = new Set(
    manualTeams.value.flatMap((team) => team.members.map((m) => m.id)),
  )
  // Retorna jogadores habilitados que não estão em nenhuma equipe
  return store.enabledPlayers.filter((player) => !assignedIds.has(player.id))
})

// Verifica se pode confirmar equipes manuais
const canConfirmManualTeams = computed(() => {
  // Precisa ter pelo menos 2 equipes
  if (manualTeams.value.length < 2) return false
  
  // Pelo menos 2 equipes devem ter jogadores
  const teamsWithMembers = manualTeams.value.filter(
    (team) => team.members.length > 0,
  )
  if (teamsWithMembers.length < 2) return false
  
  // Todos os jogadores habilitados devem estar alocados
  return unassignedPlayers.value.length === 0
})

const handleDraw = () => {
  try {
    if (calculatedTeams.value < 2) {
      alert(
        'É necessário ter jogadores suficientes para formar pelo menos 2 equipes.',
      )
      return
    }

    let drawnTeams: Team[]

    if (drawType.value === 'balanced') {
      drawnTeams = store.drawTeams(playersPerTeam.value)
    } else {
      drawnTeams = store.drawRandomTeams(playersPerTeam.value)
    }

    // Guardar preview das equipes (cópia profunda)
    previewTeams.value = JSON.parse(JSON.stringify(drawnTeams))
    showPreview.value = true
  } catch (error) {
    console.error('Erro ao sortear equipes:', error)
    alert('Erro ao sortear equipes. Tente novamente.')
  }
}

const redrawTeams = () => {
  // Sorteia novamente mantendo as configurações
  handleDraw()
}

const confirmTeams = () => {
  // As equipes já foram atualizadas no composable pelo drawTeams/drawRandomTeams
  emit('drawn')
  emit('close')
}

const backToConfig = () => {
  showPreview.value = false
  previewTeams.value = null
}

// Funções do modo manual
const switchToManualMode = () => {
  creationMode.value = 'manual'
  if (manualTeams.value.length === 0) {
    initializeManualTeams()
  }
}

const initializeManualTeams = () => {
  // Se existirem equipes formadas, carrega elas
  if (store.allTeams.length > 0) {
    // Carrega as equipes existentes (cópia profunda para não mutar o original)
    manualTeams.value = store.allTeams.map((team) => ({
      name: team.name,
      score: team.score,
      members: [...team.members], // Cópia dos membros
    }))
  } else {
    // Caso contrário, cria equipes vazias
    const teamNames = ['Equipe Vermelha', 'Equipe Azul']
    manualTeams.value = teamNames.map((name) => ({
      name,
      score: 0,
      members: [],
    }))
  }
}

const addManualTeam = () => {
  const colors = ['Verde', 'Amarela', 'Roxa']
  const teamNumber = manualTeams.value.length - 1 // -1 pois já temos Vermelha e Azul
  const name =
    teamNumber < colors.length
      ? `Equipe ${colors[teamNumber]}`
      : `Equipe ${manualTeams.value.length + 1}`

  manualTeams.value.push({
    name,
    score: 0,
    members: [],
  })
}

const resetManualTeams = () => {
  const confirmed = confirm(
    'Deseja resetar e começar do zero?\n\n' +
    'As equipes atuais serão removidas e você começará com 2 equipes vazias.',
  )
  
  if (confirmed) {
    // Cria equipes vazias
    const teamNames = ['Equipe Vermelha', 'Equipe Azul']
    manualTeams.value = teamNames.map((name) => ({
      name,
      score: 0,
      members: [],
    }))
  }
}

const removeManualTeam = (index: number) => {
  if (manualTeams.value.length <= 2) return
  
  // Move os jogadores da equipe removida de volta para o pool
  manualTeams.value.splice(index, 1)
}

const openTeamSelectionModal = (player: Player) => {
  playerToAssign.value = player
  showTeamSelectionModal.value = true
}

const closeTeamSelectionModal = () => {
  showTeamSelectionModal.value = false
  playerToAssign.value = null
}

const assignPlayerToTeamFromModal = (teamIndex: number) => {
  if (!playerToAssign.value) return

  const team = manualTeams.value[teamIndex]
  if (!team) return

  // Adiciona o jogador na equipe
  team.members.push({ ...playerToAssign.value })
  
  // Fecha o modal
  closeTeamSelectionModal()
}

const selectPlayerForAssignment = (player: Player) => {
  if (selectedPlayer.value?.id === player.id) {
    selectedPlayer.value = null
  } else {
    selectedPlayer.value = player
  }
}

const assignPlayerToTeam = (teamIndex: number) => {
  if (!selectedPlayer.value) return

  const team = manualTeams.value[teamIndex]
  if (!team) return

  // Adiciona o jogador na equipe
  team.members.push({ ...selectedPlayer.value })
  
  // Limpa a seleção
  selectedPlayer.value = null
}

const removePlayerFromTeam = (teamIndex: number, playerId: string) => {
  const team = manualTeams.value[teamIndex]
  if (!team) return
  
  team.members = team.members.filter((m) => m.id !== playerId)
}

const getTeamColorClasses = (index: number) => {
  const classes = [
    'border-red-300 bg-red-50',
    'border-blue-300 bg-blue-50',
    'border-green-300 bg-green-50',
    'border-yellow-300 bg-yellow-50',
    'border-purple-300 bg-purple-50',
  ]
  return classes[index % classes.length]
}

const getTeamTextColor = (index: number) => {
  const colors = [
    'text-red-800',
    'text-blue-800',
    'text-green-800',
    'text-yellow-800',
    'text-purple-800',
  ]
  return colors[index % colors.length]
}

const confirmManualTeams = () => {
  if (!canConfirmManualTeams.value) {
    if (unassignedPlayers.value.length > 0) {
      alert(
        `Ainda há ${unassignedPlayers.value.length} ${
          unassignedPlayers.value.length === 1 ? 'jogador' : 'jogadores'
        } sem equipe. Aloque todos os jogadores antes de confirmar.`,
      )
    } else {
      alert(
        'Certifique-se de que pelo menos 2 equipes tenham jogadores alocados.',
      )
    }
    return
  }

  // Remove equipes vazias antes de salvar
  const teamsToSave = manualTeams.value.filter(
    (team) => team.members.length > 0,
  )

  // Salva as equipes manuais no store usando o mesmo método
  store.saveManualTeams(teamsToSave)

  emit('drawn')
  emit('close')
}
</script>
