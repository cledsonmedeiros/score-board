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
          Equipes Atuais
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

      <!-- Aviso de troca de jogadores -->
      <div
        v-if="teams.some((t) => t.members.length > 0)"
        class="mb-3 flex items-center justify-between gap-2 rounded-lg
          bg-indigo-50 p-3 text-xs text-indigo-800"
      >
        <p>
          <span v-if="!selected">
            Toque em um jogador e depois em outro de outra equipe para
            trocá-los.
          </span>
          <span v-else>
            Trocando <strong>{{ selected.player.name }}</strong>. Toque em um
            jogador de outra equipe.
          </span>
        </p>
        <button
          v-if="selected"
          @click="selected = null"
          class="shrink-0 rounded-full bg-white px-2 py-1 font-semibold
            text-indigo-700 shadow-sm hover:bg-indigo-100"
        >
          Cancelar
        </button>
      </div>

      <!-- Lista de Equipes -->
      <div
        v-if="teams.some((t) => t.members.length > 0)"
        class="mb-4 grid gap-3 md:grid-cols-2"
      >
        <div
          v-for="(team, index) in teams"
          :key="index"
          v-show="team.members.length > 0"
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
            <button
              v-for="member in team.members"
              :key="member.id"
              type="button"
              @click="handlePlayerClick(index, member)"
              class="rounded-lg text-left transition-transform
                hover:scale-105"
              :class="
                isSelected(member)
                  ? 'ring-2 ring-indigo-500 ring-offset-1'
                  : ''
              "
            >
              <PlayerBadge :player="member" layout="vertical" />
            </button>
          </div>
          <!-- Info da Equipe -->
          <div
            class="mt-auto flex items-center justify-between gap-3 border-t
              border-gray-200 pt-2 text-xs text-gray-600"
          >
            <span
              >👥 {{ team.members.length }}
              {{ team.members.length === 1 ? 'jogador' : 'jogadores' }}</span
            >
            <span>{{ genderSummary(team) }}</span>
            <span
              >⚖️
              {{
                team.members.reduce((sum, m) => sum + m.weight, 0).toFixed(1)
              }}</span
            >
          </div>
        </div>
      </div>

      <!-- Aviso se não houver equipes -->
      <div v-else class="rounded-lg bg-yellow-50 p-8 text-center">
        <Icon
          name="heroicons:user-group"
          class="mx-auto mb-3 h-12 w-12 text-yellow-600"
        />
        <p class="mb-2 text-lg font-semibold text-yellow-800">
          Nenhuma equipe sorteada ainda
        </p>
        <p class="text-sm text-yellow-700">
          Vá para a página de gerenciamento para sortear equipes.
        </p>
      </div>

      <!-- Botão Fechar -->
      <div class="mt-4 flex gap-3">
        <button
          v-if="teams.some((t) => t.members.length > 0)"
          @click="shareTeams"
          class="flex flex-1 items-center justify-center gap-2 rounded-lg
            bg-blue-600 px-6 py-3 font-semibold text-white transition-colors
            hover:bg-blue-700"
        >
          <Icon name="heroicons:share" class="h-5 w-5" />
          Compartilhar
        </button>
        <button
          @click="$emit('close')"
          class="flex-1 rounded-lg bg-gray-600 px-6 py-3 font-semibold
            text-white transition-colors hover:bg-gray-700"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/stores/scoreboard'

defineEmits<{
  close: []
}>()

const props = defineProps<{
  teams: Team[]
}>()

const store = useScoreboardStore()

// Troca de jogadores entre equipes
const selected = ref<{ teamIndex: number; player: Player } | null>(null)

const isSelected = (player: Player) => selected.value?.player.id === player.id

const handlePlayerClick = (teamIndex: number, player: Player) => {
  if (!selected.value) {
    selected.value = { teamIndex, player }
    return
  }

  if (selected.value.player.id === player.id) {
    selected.value = null
    return
  }

  if (selected.value.teamIndex === teamIndex) {
    // Troca a seleção para outro jogador da mesma equipe
    selected.value = { teamIndex, player }
    return
  }

  store.swapPlayers(selected.value.player.id, player.id)
  selected.value = null
}

const genderSummary = (team: Team) => {
  const femaleCount = team.members.filter((m) => m.gender === 'F').length
  const maleCount = team.members.length - femaleCount
  return `♂ ${maleCount} · ♀ ${femaleCount}`
}

const shareTeams = async () => {
  const teamsWithMembers = props.teams.filter((t) => t.members.length > 0)

  if (teamsWithMembers.length === 0) return

  // Criar texto formatado com as equipes
  let shareText = '🏆 Equipes Sorteadas - ScoreBoard\n\n'

  teamsWithMembers.forEach((team, index) => {
    // const totalWeight = team.members.reduce((sum, m) => sum + m.weight, 0)

    shareText += `${team.name} · ${team.members.length} jogador${team.members.length > 1 ? 'es' : ''}\n`

    team.members.forEach((member) => {
      // const stars = '⭐'.repeat(member.weight)
      // shareText += `  • ${member.name} ${stars}\n`
      shareText += `• ${member.name}\n`
    })

    // if (team.score > 0) {
    //   shareText += `🏆 Pontos: ${team.score}\n`
    // }

    shareText += '\n'
  })

  // Usar Web Share API se disponível
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Equipes Sorteadas - ScoreBoard',
        text: shareText,
      })
    } catch (error) {
      // Usuário cancelou o compartilhamento ou erro
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error)
        fallbackShare(shareText)
      }
    }
  } else {
    // Fallback: copiar para clipboard
    fallbackShare(shareText)
  }
}

const fallbackShare = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Texto copiado para a área de transferência!')
  } catch (error) {
    console.error('Erro ao copiar:', error)
    alert('Não foi possível compartilhar. Tente novamente.')
  }
}
</script>
