<template>
  <div class="flex h-full flex-col items-center bg-gray-50 p-3 md:p-6">
    <!-- Container centralizado -->
    <div class="w-full max-w-5xl space-y-6">
      <!-- Cabeçalho -->
      <div>
        <h1 class="text-2xl font-bold text-gray-800 md:text-3xl">
          Gerenciar Jogadores
        </h1>
        <p class="mt-2 text-xs text-gray-600 md:text-sm">
          Adicione jogadores, defina pesos e gerencie a lista para sorteio de
          equipes
        </p>
      </div>

      <!-- Formulário de Adição -->
      <div class="rounded-lg bg-white p-4 shadow">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          Adicionar Jogador
        </h2>
        <form
          @submit.prevent="handleAddPlayer"
          class="flex flex-col gap-4 md:flex-row"
        >
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Nome</label
            >
            <input
              v-model="newPlayerName"
              type="text"
              placeholder="Digite o nome do jogador"
              class="w-full rounded-lg border border-gray-300 px-4 py-2
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                focus:outline-none"
              required
            />
          </div>
          <div class="flex-shrink-0">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Nível (1-5 estrelas)</label
            >
            <div
              class="flex h-[42px] items-center rounded-lg border
                border-gray-300 bg-white px-3"
            >
              <StarRating
                :model-value="newPlayerWeight"
                @update="newPlayerWeight = $event"
              />
            </div>
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              class="w-full rounded-lg bg-blue-600 px-6 py-2 font-semibold
                text-white transition-colors hover:bg-blue-700 md:w-auto"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de Jogadores -->
      <div class="flex flex-col overflow-hidden rounded-lg bg-white shadow">
        <div class="flex items-center justify-between border-b p-4">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ filteredPlayers.length }} Jogadores
          </h2>
          <button
            v-if="store.players.length > 0"
            @click="showOnlyEnabled = !showOnlyEnabled"
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium
              text-gray-700 transition-colors hover:bg-gray-200"
          >
            {{ showOnlyEnabled ? 'Mostrar Todos' : 'Apenas Habilitados' }}
          </button>
        </div>

        <div class="max-h-[calc(100vh-500px)] overflow-x-hidden overflow-y-auto pb-20 md:pb-24">
          <div v-if="filteredPlayers.length === 0" class="p-8 text-center">
            <p class="text-gray-500">
              {{
                showOnlyEnabled
                  ? 'Nenhum jogador habilitado'
                  : 'Nenhum jogador cadastrado'
              }}
            </p>
          </div>

          <div
            v-for="player in filteredPlayers"
            :key="player.id"
            :class="[
              'flex items-center gap-3 border-b p-4 transition-colors',
              player.enabled
                ? 'bg-white hover:bg-gray-50'
                : 'bg-gray-100 opacity-60',
            ]"
          >
            <!-- Toggle Habilitado/Desabilitado -->
            <button
              @click="store.togglePlayerEnabled(player.id)"
              :class="[
                `flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
                transition-colors`,
                player.enabled
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300',
              ]"
              :title="
                player.enabled ? 'Desabilitar jogador' : 'Habilitar jogador'
              "
            >
              <Icon
                :name="
                  player.enabled ? 'heroicons:check' : 'heroicons:x-mark'
                "
                class="h-6 w-6"
              />
            </button>

            <!-- Nome (editável) -->
            <div class="min-w-0 flex-1">
              <input
                v-if="editingPlayerId === player.id"
                :ref="setEditInputRef"
                v-model="editingPlayerName"
                @blur="savePlayerEdit(player.id)"
                @keyup.enter="savePlayerEdit(player.id)"
                @keyup.esc="cancelEdit"
                type="text"
                class="w-full rounded border border-blue-300 px-2 py-1
                  focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div v-else class="flex items-center gap-2">
                <span
                  :class="[
                    'font-medium text-sm',
                    player.enabled ? 'text-gray-800' : 'text-gray-500',
                  ]"
                  :title="player.name"
                  >{{ truncateText(player.name) }}</span
                >
                <button
                  @click="startEdit(player)"
                  class="flex-shrink-0 text-gray-400 hover:text-blue-600"
                  title="Editar nome"
                >
                  <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Peso -->
            <div class="flex-shrink-0">
              <StarRating
                :model-value="player.weight"
                @update="store.updatePlayer(player.id, { weight: $event })"
                size="sm"
              />
            </div>

            <!-- Botão Remover -->
            <button
              @click="handleRemovePlayer(player.id)"
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center
                rounded-full text-red-600 transition-colors hover:bg-red-50"
              title="Remover jogador"
            >
              <Icon name="heroicons:trash" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'

const store = useScoreboardStore()

const { truncateText } = useFormatters()

// Formulário de novo jogador
const newPlayerName = ref('')
const newPlayerWeight = ref(3)

// Filtro
const showOnlyEnabled = ref(false)

// Edição
const editingPlayerId = ref<string | null>(null)
const editingPlayerName = ref('')
let editInput: any = null

const setEditInputRef = (el: any) => {
  editInput = el
}

const filteredPlayers = computed(() => {
  if (showOnlyEnabled.value) {
    return store.players.filter((p) => p.enabled)
  }
  return store.players
})

const handleAddPlayer = () => {
  if (newPlayerName.value.trim()) {
    store.addPlayer(newPlayerName.value, newPlayerWeight.value)
    newPlayerName.value = ''
    newPlayerWeight.value = 3
  }
}

const handleRemovePlayer = (playerId: string) => {
  if (confirm('Tem certeza que deseja remover este jogador?')) {
    store.removePlayer(playerId)
  }
}

const startEdit = (player: Player) => {
  editingPlayerId.value = player.id
  editingPlayerName.value = player.name
  
  // Mover cursor para o fim do texto
  nextTick(() => {
    if (editInput) {
      editInput.focus()
      const length = editInput.value.length
      editInput.setSelectionRange(length, length)
    }
  })
}

const savePlayerEdit = (playerId: string) => {
  if (editingPlayerName.value.trim()) {
    store.updatePlayer(playerId, { name: editingPlayerName.value })
  }
  editingPlayerId.value = null
  editingPlayerName.value = ''
}

const cancelEdit = () => {
  editingPlayerId.value = null
  editingPlayerName.value = ''
}
</script>
