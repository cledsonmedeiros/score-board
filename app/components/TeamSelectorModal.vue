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
        v-if="availableTeams.length === 0"
        class="rounded-lg bg-yellow-50 p-4 text-center"
      >
        <p class="text-yellow-800">
          Nenhuma equipe disponível. Sortear equipes primeiro.
        </p>
      </div>

      <!-- Seletores -->
      <div v-else class="space-y-4">
        <!-- Seletor Vermelho -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">
            Equipe Vermelha (Superior)
          </label>
          <select
            v-model="localRedTeamIndex"
            class="w-full rounded-lg border border-gray-300 px-4 py-2
              focus:border-red-500 focus:outline-none focus:ring-2
              focus:ring-red-500"
          >
            <option
              v-for="(team, index) in availableTeams"
              :key="index"
              :value="index"
              :disabled="index === localBlueTeamIndex"
            >
              {{ team.name }} ({{ team.members.length }}
              {{ team.members.length === 1 ? 'jogador' : 'jogadores' }})
            </option>
          </select>
          
          <!-- Membros da equipe vermelha -->
          <div
            v-if="availableTeams[localRedTeamIndex]"
            class="mt-2 rounded-lg border-2 border-red-300 bg-red-50 p-3"
          >
            <div class="mb-1 text-xs font-semibold text-red-800">Membros:</div>
            <div class="flex flex-wrap gap-2">
              <PlayerBadge
                v-for="member in availableTeams[localRedTeamIndex]!.members"
                :key="member.id"
                :player="member"
              />
            </div>
          </div>
        </div>

        <!-- Seletor Azul -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">
            Equipe Azul (Inferior)
          </label>
          <select
            v-model="localBlueTeamIndex"
            class="w-full rounded-lg border border-gray-300 px-4 py-2
              focus:border-blue-500 focus:outline-none focus:ring-2
              focus:ring-blue-500"
          >
            <option
              v-for="(team, index) in availableTeams"
              :key="index"
              :value="index"
              :disabled="index === localRedTeamIndex"
            >
              {{ team.name }} ({{ team.members.length }}
              {{ team.members.length === 1 ? 'jogador' : 'jogadores' }})
            </option>
          </select>
          
          <!-- Membros da equipe azul -->
          <div
            v-if="availableTeams[localBlueTeamIndex]"
            class="mt-2 rounded-lg border-2 border-blue-300 bg-blue-50 p-3"
          >
            <div class="mb-1 text-xs font-semibold text-blue-800">Membros:</div>
            <div class="flex flex-wrap gap-2">
              <PlayerBadge
                v-for="member in availableTeams[localBlueTeamIndex]!.members"
                :key="member.id"
                :player="member"
              />
            </div>
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
          :disabled="availableTeams.length === 0"
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
import type { Team } from '~/stores/scoreboard'

const props = defineProps<{
  teams: Team[]
  redTeamIndex: number
  blueTeamIndex: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [{ redTeamIndex: number; blueTeamIndex: number }]
}>()

const availableTeams = computed(() => 
  props.teams.filter(t => t.members.length > 0)
)

const localRedTeamIndex = ref(props.redTeamIndex)
const localBlueTeamIndex = ref(props.blueTeamIndex)

const handleConfirm = () => {
  emit('confirm', {
    redTeamIndex: localRedTeamIndex.value,
    blueTeamIndex: localBlueTeamIndex.value,
  })
  emit('close')
}
</script>
