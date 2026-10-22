<template>
  <AppSheet ref="sheet" :title="sheetTitle" size="3xl" @close="$emit('close')">
    <!-- Modo de Criação -->
    <UTabs
      v-if="!showPreview"
      :items="MODE_ITEMS"
      :model-value="creationMode"
      :content="false"
      class="mb-4"
      @update:model-value="selectMode"
    />

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
      <DrawPreview :teams="previewTeams" :bench="previewBench" />
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
        <!-- Quantidade de equipes -->
        <UFormField
          label="Quantidade de Equipes"
          :help="`Mínimo: ${MIN_TEAMS} | Máximo: ${maxTeams}`"
        >
          <UInputNumber
            v-model="numberOfTeams"
            :min="MIN_TEAMS"
            :max="maxTeams"
            class="w-full"
          />
        </UFormField>

        <!-- Jogadores por equipe (opcional) -->
        <UFormField
          label="Jogadores por Equipe"
          hint="opcional"
          help="Em branco, todos jogam. Preenchido, quem sobrar fica de fora."
        >
          <div class="flex gap-2">
            <UInputNumber
              v-model.optional="playersPerTeam"
              :min="1"
              :max="maxPlayersPerTeam"
              placeholder="Todos jogam"
              data-testid="players-per-team"
              class="flex-1"
            />
            <UButton
              v-if="playersPerTeam !== undefined"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              aria-label="Limpar: todos jogam"
              @click="playersPerTeam = undefined"
            />
          </div>
        </UFormField>
        <p
          v-if="teamSizeLabel"
          class="-mt-2 text-xs font-semibold"
          :class="isValidPlayersPerTeam ? 'text-primary' : 'text-error'"
        >
          {{ teamSizeLabel }}
        </p>

        <!-- Tipo de sorteio -->
        <UFormField label="Tipo de Sorteio">
          <URadioGroup
            v-model="drawType"
            :items="DRAW_TYPE_ITEMS"
            variant="card"
            :ui="{ fieldset: 'flex-col gap-3 md:flex-row', item: 'flex-1' }"
          />
        </UFormField>

        <!-- Restrições de Sorteio -->
        <PairRulesEditor />
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
    </div>

    <!-- Modo Manual -->
    <div v-else>
      <!-- Info sobre edição -->
      <div
        v-if="store.allTeams.length > 0"
        class="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
      >
        <div class="flex items-start gap-2">
          <Icon
            name="heroicons:pencil-square"
            class="mt-0.5 h-5 w-5 shrink-0"
          />
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
          <UButton
            v-if="store.allTeams.length > 0"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-heroicons-arrow-path"
            label="Resetar"
            title="Começar do zero"
            @click="resetManualTeams"
          />
          <UButton
            variant="soft"
            size="sm"
            icon="i-heroicons-plus"
            label="Adicionar Equipe"
            :disabled="manualTeams.length >= 5"
            @click="addManualTeam"
          />
        </div>
      </div>

      <!-- Pool de Jogadores Não Alocados -->
      <div class="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-3">
        <h3 class="mb-2 text-sm font-medium text-gray-700">
          Jogadores Disponíveis ({{ unassignedPlayers.length }})
        </h3>
        <div v-if="unassignedPlayers.length > 0" class="flex flex-wrap gap-2">
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
      <div class="mb-4 space-y-3">
        <div
          v-for="(team, index) in manualTeams"
          :key="index"
          class="flex flex-col rounded-lg border-2 p-3"
          :class="teamPalette(index).card"
        >
          <div class="mb-2 flex items-center justify-between">
            <input
              v-model="team.name"
              type="text"
              class="flex-1 rounded border-none bg-transparent text-base
                font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              :class="teamPalette(index).title"
              placeholder="Nome da Equipe"
            />
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-trash"
              class="ml-2 hover:text-error"
              aria-label="Remover equipe"
              :disabled="manualTeams.length <= 2"
              @click="removeManualTeam(index)"
            />
          </div>

          <div
            class="mb-2 min-h-20 rounded border-2 border-dashed p-2"
            :class="'border-gray-300 bg-white/30'"
          >
            <div v-if="team.members.length > 0" class="flex flex-wrap gap-2">
              <div
                v-for="member in team.members"
                :key="member.id"
                class="group inline-flex items-center gap-0.5"
              >
                <PlayerBadge :player="member" />
                <UButton
                  color="error"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-x-circle-solid"
                  class="rounded-full p-0.5 transition-opacity md:opacity-0
                    md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  :aria-label="`Tirar ${member.name} da equipe`"
                  @click.stop="removePlayerFromTeam(index, member.id)"
                />
              </div>
            </div>
            <p v-else class="text-center text-sm text-gray-500">
              Nenhum jogador
            </p>
          </div>

          <!-- Info da Equipe -->
          <TeamSummaryLine :team="team" />
        </div>
      </div>
    </div>

    <!-- Seleção de equipe para um jogador (modo manual) -->
    <UModal
      :open="showTeamSelectionModal && !!playerToAssign"
      title="Escolha a Equipe"
      @update:open="(open: boolean) => !open && closeTeamSelectionModal()"
    >
      <template #body>
        <div v-if="playerToAssign" class="mb-4 rounded-lg bg-blue-50 p-3">
          <PlayerBadge :player="playerToAssign" layout="horizontal" />
        </div>

        <div class="space-y-2">
          <button
            v-for="(team, index) in manualTeams"
            :key="index"
            class="flex w-full items-center justify-between rounded-lg border-2
              p-3 transition-colors hover:bg-gray-50"
            :class="teamPalette(index).card"
            @click="assignPlayerToTeamFromModal(index)"
          >
            <div class="text-left">
              <p class="font-semibold" :class="teamPalette(index).title">
                {{ team.name }}
              </p>
              <p class="text-xs text-gray-600">
                {{ team.members.length }}
                {{ team.members.length === 1 ? 'jogador' : 'jogadores' }} ·
                Peso: {{ teamWeight(team) }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-arrow-right"
              class="size-5 text-gray-400"
            />
          </button>
        </div>
      </template>
    </UModal>
    <template #footer>
      <!-- Preview: sortear de novo / confirmar / voltar -->
      <div v-if="showPreview" class="grid w-full grid-cols-2 gap-2">
        <UButton
          class="justify-center"
          color="warning"
          variant="soft"
          size="lg"
          icon="i-heroicons-arrow-path"
          label="Sortear Novamente"
          @click="redrawTeams"
        />
        <UButton
          class="justify-center"
          color="success"
          size="lg"
          icon="i-heroicons-check"
          label="Confirmar"
          @click="confirmTeams"
        />
        <UButton
          class="col-span-2 justify-center"
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-left"
          label="Voltar"
          @click="backToConfig"
        />
      </div>

      <div v-else class="grid w-full grid-cols-2 gap-2">
        <UButton
          class="justify-center"
          color="neutral"
          variant="outline"
          size="lg"
          label="Cancelar"
          @click="sheet?.close()"
        />
        <UButton
          v-if="creationMode === 'auto'"
          class="justify-center"
          size="lg"
          label="Sortear Equipes"
          :disabled="
            store.enabledPlayers.length === 0 ||
            !isValidNumberOfTeams ||
            !isValidPlayersPerTeam
          "
          @click="handleDraw"
        />
        <UButton
          v-else
          class="justify-center"
          color="success"
          size="lg"
          icon="i-heroicons-check"
          label="Confirmar"
          :disabled="!canConfirmManualTeams"
          @click="confirmManualTeams"
        />
      </div>
    </template>
  </AppSheet>
</template>

<script setup lang="ts">
import type { Team, Player } from '~/stores/scoreboard'

const emit = defineEmits<{
  close: []
  drawn: []
}>()

const store = useScoreboardStore()
const { askConfirm } = usePrompt()
const notify = useNotify()
const sheet = useTemplateRef('sheet')

// Modo de criação: 'auto' (sorteio) ou 'manual'
const creationMode = ref<'auto' | 'manual'>('auto')

const MODE_ITEMS = [
  { label: 'Sorteio', icon: 'i-heroicons-sparkles', value: 'auto' },
  { label: 'Manual', icon: 'i-heroicons-hand-raised', value: 'manual' },
]

const DRAW_TYPE_ITEMS = [
  {
    value: 'balanced',
    label: 'Balanceado',
    description:
      'Espalha cabeças de chave; equilibra posições, habilidade e gênero (nessa ordem)',
  },
  {
    value: 'random',
    label: 'Aleatório',
    description:
      'Ignora habilidade; espalha cabeças de chave e equilibra posições e gênero',
  },
]

const selectMode = (mode: string | number) => {
  if (mode === 'manual') switchToManualMode()
  else creationMode.value = 'auto'
}

// Estados do modo automático
const MIN_TEAMS = 2
const DEFAULT_TEAMS = 3
const numberOfTeams = ref(
  Math.max(MIN_TEAMS, Math.min(DEFAULT_TEAMS, store.enabledPlayers.length)),
)
const drawType = ref<'balanced' | 'random'>('balanced')
const previewTeams = ref<Team[] | null>(null)
const previewBench = ref<Player[]>([])
/** Vazio = todos jogam (tamanhos diferem em no máximo 1). */
const playersPerTeam = ref<number>()
const showPreview = ref(false)
const sheetTitle = computed(() => {
  if (showPreview.value) return 'Equipes Sorteadas'
  return creationMode.value === 'auto' ? 'Sortear Equipes' : 'Montar Equipes'
})

// Estados do modo manual
const manualTeams = ref<Team[]>([])
const selectedPlayer = ref<Player | null>(null)
const showTeamSelectionModal = ref(false)
const playerToAssign = ref<Player | null>(null)

const maxTeams = computed(() =>
  Math.max(MIN_TEAMS, store.enabledPlayers.length),
)

const isValidNumberOfTeams = computed(
  () =>
    Number.isInteger(numberOfTeams.value) &&
    numberOfTeams.value >= MIN_TEAMS &&
    numberOfTeams.value <= store.enabledPlayers.length,
)

const plural = (count: number, singular: string, pluralForm: string) =>
  count === 1 ? singular : pluralForm

/** Tamanho fixo informado, ou `undefined` quando todos jogam. */
const fixedTeamSize = computed(() => playersPerTeam.value)

const maxPlayersPerTeam = computed(() =>
  isValidNumberOfTeams.value
    ? Math.floor(store.enabledPlayers.length / numberOfTeams.value)
    : store.enabledPlayers.length,
)

const isValidPlayersPerTeam = computed(() => {
  const size = fixedTeamSize.value
  if (size === undefined) return true
  return Number.isInteger(size) && size >= 1 && size <= maxPlayersPerTeam.value
})

/** Ex.: "2 equipes de 6 e 1 de 5 jogadores" ou "2 equipes de 4 jogadores · 2 de fora". */
const teamSizeLabel = computed(() => {
  if (!isValidNumberOfTeams.value) return ''

  const total = store.enabledPlayers.length
  const teams = numberOfTeams.value
  const teamsWord = plural(teams, 'equipe', 'equipes')
  const size = fixedTeamSize.value

  if (size !== undefined) {
    if (!isValidPlayersPerTeam.value) {
      return `Máximo de ${maxPlayersPerTeam.value} por equipe com ${teams} ${teamsWord} e ${total} jogadores`
    }
    const bench = total - teams * size
    const benchLabel = bench > 0 ? ` · ${bench} de fora` : ''
    return `${teams} ${teamsWord} de ${size} ${plural(size, 'jogador', 'jogadores')}${benchLabel}`
  }

  const smallSize = Math.floor(total / teams)
  const largeCount = total % teams
  const smallCount = teams - largeCount

  if (largeCount === 0) {
    return `${teams} ${teamsWord} de ${smallSize} jogadores`
  }
  return `${largeCount} ${plural(largeCount, 'equipe', 'equipes')} de ${smallSize + 1} e ${smallCount} de ${smallSize} jogadores`
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
    if (!isValidNumberOfTeams.value) {
      notify.error(
        `Escolha entre ${MIN_TEAMS} e ${store.enabledPlayers.length} equipes.`,
      )
      return
    }

    if (!isValidPlayersPerTeam.value) {
      notify.error(teamSizeLabel.value)
      return
    }

    const { teams, bench } = store.drawTeams(
      numberOfTeams.value,
      drawType.value,
      fixedTeamSize.value,
    )

    // Guardar preview das equipes (cópia profunda)
    previewTeams.value = JSON.parse(JSON.stringify(teams))
    previewBench.value = bench
    showPreview.value = true
  } catch (error) {
    console.error('Erro ao sortear equipes:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao sortear equipes. Tente novamente.'
    notify.error(message)
  }
}

const redrawTeams = () => {
  // Sorteia novamente mantendo as configurações
  handleDraw()
}

const confirmTeams = () => {
  // As equipes já foram atualizadas no store pelo drawTeams
  emit('drawn')
  emit('close')
}

const backToConfig = () => {
  showPreview.value = false
  previewTeams.value = null
  previewBench.value = []
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

const resetManualTeams = async () => {
  const confirmed = await askConfirm({
    title: 'Resetar equipes manuais?',
    message:
      'As equipes atuais serão removidas e você começará com 2 equipes vazias.',
    confirmLabel: 'Resetar',
    cancelLabel: 'Cancelar',
    confirmTone: 'danger',
  })

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

const confirmManualTeams = () => {
  if (!canConfirmManualTeams.value) {
    if (unassignedPlayers.value.length > 0) {
      notify.error(
        `Ainda há ${unassignedPlayers.value.length} ${
          unassignedPlayers.value.length === 1 ? 'jogador' : 'jogadores'
        } sem equipe. Aloque todos os jogadores antes de confirmar.`,
      )
    } else {
      notify.error(
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
