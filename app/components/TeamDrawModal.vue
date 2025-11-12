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
      <div class="mb-4 flex items-center justify-between md:mb-6">
        <h2 class="text-xl font-bold text-gray-800 md:text-2xl">
          Sortear Equipes
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
      <div v-else>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Team } from '~/stores/scoreboard'

const emit = defineEmits<{
  close: []
  drawn: []
}>()

const store = useScoreboardStore()

const playersPerTeam = ref(4)
const drawType = ref<'balanced' | 'random'>('balanced')
const previewTeams = ref<Team[] | null>(null)
const showPreview = ref(false)

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
</script>
