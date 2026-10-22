<template>
  <div>
    <!-- Equipes sorteadas -->
    <div class="mb-4 grid gap-3 md:grid-cols-2">
      <div
        v-for="(team, index) in teams"
        :key="index"
        class="flex min-h-40 flex-col rounded-lg border-2 p-3"
        :class="teamPalette(index).card"
      >
        <h3 class="mb-2 text-base font-bold" :class="teamPalette(index).title">
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
        <TeamSummaryLine class="mt-auto" :team="team" />
      </div>
    </div>

    <!-- Quem ficou de fora -->
    <div
      v-if="bench.length > 0"
      class="mb-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50
        p-3"
      data-testid="draw-bench"
    >
      <h3 class="mb-1 text-base font-bold text-gray-700">
        🪑 De fora ({{ bench.length }})
      </h3>
      <p class="mb-2 text-xs text-gray-500">
        Entram depois no lugar de jogadores da equipe que perder.
      </p>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <PlayerBadge
          v-for="player in bench"
          :key="player.id"
          :player="player"
          layout="vertical"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/stores/scoreboard'

/** Resultado de um sorteio: as equipes e quem ficou de fora. */
defineProps<{ teams: Team[]; bench: Player[] }>()
</script>
