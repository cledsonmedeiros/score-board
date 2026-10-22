<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200
      pt-2 text-xs text-gray-600"
  >
    <span>
      👥 {{ team.members.length }}
      {{ team.members.length === 1 ? 'jogador' : 'jogadores' }}
    </span>
    <span>{{ genderSummary(team) }}</span>
    <span :title="POSITION_SUMMARY_TITLE">{{ positionSummary(team) }}</span>
    <span>⚖️ {{ teamWeight(team) }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Team } from '~/stores/scoreboard'

defineProps<{ team: Team }>()
</script>
