<template>
  <AppSheet
    ref="sheet"
    title="Equipes Atuais"
    size="2xl"
    @close="$emit('close')"
  >
    <!-- Aviso de troca de jogadores -->
    <div
      v-if="teams.some((t) => t.members.length > 0)"
      class="mb-3 flex items-center justify-between gap-2 rounded-lg
        bg-indigo-50 p-3 text-xs text-indigo-800"
    >
      <p>
        <span v-if="!selected">
          Toque em um jogador e depois em outro de outra equipe para trocá-los.
        </span>
        <span v-else>
          Trocando <strong>{{ selected.player.name }}</strong
          >. Toque em um jogador de outra equipe.
        </span>
      </p>
      <button
        v-if="selected"
        @click="selected = null"
        class="shrink-0 rounded-full bg-white px-2 py-1 font-semibold
          text-indigo-700 shadow-xs hover:bg-indigo-100"
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
        :class="teamPalette(index).card"
      >
        <h3 class="mb-2 text-base font-bold" :class="teamPalette(index).title">
          {{ team.name }}
        </h3>
        <div class="mb-2 grid flex-1 grid-cols-2 content-start gap-2">
          <button
            v-for="member in team.members"
            :key="member.id"
            type="button"
            @click="handlePlayerClick(index, member)"
            class="rounded-lg text-left transition-transform hover:scale-105"
            :class="
              isSelected(member) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
            "
          >
            <PlayerBadge :player="member" layout="vertical" />
          </button>
        </div>
        <!-- Info da Equipe -->
        <TeamSummaryLine class="mt-auto" :team="team" />
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

    <template #footer>
      <div class="flex w-full gap-3">
        <UButton
          v-if="teams.some((t) => t.members.length > 0)"
          class="flex-1 justify-center"
          size="lg"
          icon="i-heroicons-share"
          label="Compartilhar"
          @click="shareTeams"
        />
        <UButton
          class="flex-1 justify-center"
          color="neutral"
          variant="outline"
          size="lg"
          label="Fechar"
          @click="sheet?.close()"
        />
      </div>
    </template>
  </AppSheet>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/stores/scoreboard'

const notify = useNotify()
const sheet = useTemplateRef('sheet')

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
    notify.success('Texto copiado para a área de transferência!')
  } catch (error) {
    console.error('Erro ao copiar:', error)
    notify.error('Não foi possível compartilhar. Tente novamente.')
  }
}
</script>
