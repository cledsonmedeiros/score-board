<template>
  <div class="flex w-full flex-col items-center p-3 md:p-6">
    <!-- Container centralizado -->
    <div class="w-full max-w-5xl space-y-6">
      <!-- Formulário de Adição -->
      <div class="rounded-lg bg-white p-3 shadow-sm md:p-4">
        <form
          @submit.prevent="handleAddPlayer"
          class="flex flex-col gap-2 md:flex-row md:items-end md:gap-3"
        >
          <UFormField label="Nome" class="flex-1">
            <UInput
              v-model="newPlayerName"
              placeholder="Nome do jogador"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField label="Nível" class="shrink-0">
            <div
              class="flex h-[38px] items-center rounded-lg border
                border-gray-300 bg-white px-3"
            >
              <WeightSlider
                :model-value="newPlayerWeight"
                @update="newPlayerWeight = $event"
              />
            </div>
          </UFormField>
          <UFormField label="Gênero" class="shrink-0">
            <GenderToggle
              :model-value="newPlayerGender"
              @update="newPlayerGender = $event"
            />
          </UFormField>
          <UFormField label="Posições" class="shrink-0">
            <PositionToggles
              :model-value="newPlayerPositions"
              @update="newPlayerPositions = $event"
            />
          </UFormField>
          <UButton
            type="submit"
            label="Adicionar"
            class="w-full justify-center md:w-auto"
          />
        </form>
      </div>

      <!-- Lista de Jogadores -->
      <div class="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        <div class="flex items-center justify-between border-b p-4">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ filteredPlayers.length }} Jogadores
          </h2>
          <UButton
            v-if="store.players.length > 0"
            color="neutral"
            variant="soft"
            :label="showOnlyEnabled ? 'Mostrar Todos' : 'Apenas Habilitados'"
            @click="showOnlyEnabled = !showOnlyEnabled"
          />
        </div>

        <div class="overflow-x-hidden">
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
              `flex flex-col gap-2 border-b p-4 transition-colors sm:flex-row
              sm:items-center sm:gap-3`,
              player.enabled
                ? 'bg-white hover:bg-gray-50'
                : 'bg-gray-100 opacity-60',
            ]"
          >
            <!-- Linha 1 no mobile (vira parte da linha única a partir de sm):
              habilitar/desabilitar, nome e remover -->
            <div class="flex items-center gap-3 sm:contents">
              <!-- Habilitado para sorteio -->
              <USwitch
                :model-value="player.enabled"
                size="lg"
                color="success"
                :aria-label="
                  player.enabled ? 'Desabilitar jogador' : 'Habilitar jogador'
                "
                :title="
                  player.enabled ? 'Desabilitar jogador' : 'Habilitar jogador'
                "
                @update:model-value="store.togglePlayerEnabled(player.id)"
              />

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
                    focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <div v-else class="flex items-center gap-2">
                  <span
                    :class="[
                      'truncate text-sm font-medium',
                      player.enabled ? 'text-gray-800' : 'text-gray-500',
                    ]"
                    :title="player.name"
                    >{{ truncateText(player.name) }}</span
                  >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-pencil-square"
                    aria-label="Editar nome"
                    title="Editar nome"
                    @click="startEdit(player)"
                  />
                </div>
              </div>

              <!-- Remover: no mobile fica junto do nome; a partir de sm, vai
                para o fim da linha (segunda cópia abaixo) -->
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                class="shrink-0 rounded-full sm:hidden"
                aria-label="Remover jogador"
                title="Remover jogador"
                @click="handleRemovePlayer(player.id)"
              />
            </div>

            <!-- Linha 2 no mobile (nível e gênero); a partir de sm, junta-se
              à linha única acima. flex-wrap é uma rede de segurança: se
              ainda assim não couber (telas muito estreitas/zoom), o gênero
              quebra para uma 3ª linha em vez de ser cortado pelo
              overflow-x-hidden da lista. -->
            <div class="flex flex-wrap items-center gap-3 sm:contents">
              <UButton
                :color="player.seed ? 'warning' : 'neutral'"
                :variant="player.seed ? 'soft' : 'ghost'"
                :icon="
                  player.seed ? 'i-heroicons-star-solid' : 'i-heroicons-star'
                "
                class="shrink-0 rounded-full"
                :class="player.seed ? '' : 'text-dimmed'"
                :aria-pressed="player.seed"
                :aria-label="
                  player.seed
                    ? 'Cabeça de chave (clique para remover)'
                    : 'Marcar como cabeça de chave'
                "
                :title="
                  player.seed
                    ? 'Cabeça de chave (clique para remover)'
                    : 'Marcar como cabeça de chave'
                "
                @click="store.updatePlayer(player.id, { seed: !player.seed })"
              />

              <div class="shrink-0">
                <WeightSlider
                  :model-value="player.weight"
                  @update="store.updatePlayer(player.id, { weight: $event })"
                />
              </div>

              <div class="shrink-0">
                <GenderToggle
                  :model-value="player.gender"
                  @update="store.updatePlayer(player.id, { gender: $event })"
                  size="sm"
                />
              </div>

              <div class="shrink-0">
                <PositionToggles
                  :model-value="player.positions"
                  @update="store.updatePlayer(player.id, { positions: $event })"
                  size="sm"
                />
              </div>

              <!-- Remover: cópia visível só a partir de sm (ver linha 1) -->
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                class="hidden shrink-0 rounded-full sm:flex"
                aria-label="Remover jogador"
                title="Remover jogador"
                @click="handleRemovePlayer(player.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Gender, Player } from '~/stores/scoreboard'
import { SKILL_DEFAULT, emptyPositions } from '~/utils/playerProfile'

const store = useScoreboardStore()
const { askConfirm } = usePrompt()

const { truncateText } = useFormatters()

// Formulário de novo jogador
const newPlayerName = ref('')
const newPlayerWeight = ref(SKILL_DEFAULT)
const newPlayerGender = ref<Gender>('M')
const newPlayerPositions = ref(emptyPositions())

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
    store.addPlayer(
      newPlayerName.value,
      newPlayerWeight.value,
      newPlayerGender.value,
      newPlayerPositions.value,
    )
    newPlayerName.value = ''
    newPlayerWeight.value = SKILL_DEFAULT
    newPlayerGender.value = 'M'
    newPlayerPositions.value = emptyPositions()
  }
}

const handleRemovePlayer = async (playerId: string) => {
  const confirmed = await askConfirm({
    title: 'Remover jogador?',
    message: 'Tem certeza que deseja remover este jogador?',
    confirmLabel: 'Remover',
    cancelLabel: 'Cancelar',
    confirmTone: 'danger',
  })

  if (confirmed) {
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
