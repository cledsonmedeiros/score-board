<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white
        p-4 shadow-2xl md:p-6"
      @click.stop
    >
      <!-- Cabeçalho -->
      <div class="mb-4 flex items-center justify-between md:mb-6">
        <h2 class="text-xl font-bold text-gray-800 md:text-2xl">
          Times Atuais
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

      <!-- Lista de Times -->
      <div v-if="teams.some(t => t.members.length > 0)" class="mb-4 grid gap-3 md:grid-cols-2">
        <div
          v-for="(team, index) in teams"
          :key="index"
          v-show="team.members.length > 0"
          class="flex min-h-[160px] flex-col rounded-lg border-2 p-3"
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
          <div class="mb-2 grid flex-1 grid-cols-2 gap-2 content-start">
            <PlayerBadge
              v-for="member in team.members"
              :key="member.id"
              :player="member"
              layout="vertical"
            />
          </div>
          <!-- Info do time -->
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
            <span class="ml-auto">
              🏆 {{ team.score }} {{ team.score === 1 ? 'ponto' : 'pontos' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Aviso se não houver times -->
      <div
        v-else
        class="rounded-lg bg-yellow-50 p-8 text-center"
      >
        <Icon name="heroicons:user-group" class="mx-auto mb-3 h-12 w-12 text-yellow-600" />
        <p class="text-lg font-semibold text-yellow-800 mb-2">
          Nenhum time sorteado ainda
        </p>
        <p class="text-sm text-yellow-700">
          Vá para a página de gerenciamento para sortear times.
        </p>
      </div>

      <!-- Botão Fechar -->
      <div class="mt-4">
        <button
          @click="$emit('close')"
          class="w-full rounded-lg bg-gray-600 px-6 py-3 font-semibold
            text-white transition-colors hover:bg-gray-700"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Team } from '~/stores/scoreboard'

defineEmits<{
  close: []
}>()

const props = defineProps<{
  teams: Team[]
}>()
</script>
