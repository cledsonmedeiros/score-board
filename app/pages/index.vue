<template>
  <div class="flex h-dvh w-screen overflow-hidden select-none">
    <!-- Menu de ações (botão flutuante) -->
    <UDropdownMenu
      :items="menuItems"
      :content="{ align: 'end', sideOffset: 8 }"
      :ui="{ content: 'min-w-56' }"
    >
      <UButton
        icon="i-heroicons-bars-3"
        aria-label="Abrir menu"
        title="Menu"
        :ui="{ leadingIcon: 'size-6 sm:size-7' }"
        class="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-2 z-20
          size-12 justify-center rounded-full text-white shadow-xl sm:right-4
          sm:size-14"
        :class="
          isLandscape
            ? 'bg-blue-700 hover:bg-blue-800 active:bg-blue-800'
            : 'bg-red-700 hover:bg-red-800 active:bg-red-800'
        "
      />
    </UDropdownMenu>

    <!-- Container dos Placares -->
    <div
      class="flex h-dvh w-full"
      :class="isLandscape ? 'flex-row' : 'flex-col'"
    >
      <!-- Equipe Vermelha -->
      <TeamScore color="red" />

      <!-- ScoreControl no Centro -->
      <ScaleTransition>
        <ScoreControl />
      </ScaleTransition>

      <!-- Equipe Azul -->
      <TeamScore color="blue" />
    </div>

    <!-- Modal de Sorteio -->
    <LazyTeamDrawModal
      v-if="showDrawModal"
      @close="showDrawModal = false"
      @drawn="showDrawModal = false"
    />

    <!-- Modal de Visualização -->
    <LazyViewTeamsModal
      v-if="showViewModal"
      :teams="store.allTeams"
      @close="showViewModal = false"
    />

    <!-- Modal de Seleção de Equipes -->
    <LazyTeamSelectorModal
      v-if="showSelectorModal"
      @close="showSelectorModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const store = useScoreboardStore()
const { isLandscape } = useOrientation()

const showDrawModal = ref(false)
const showViewModal = ref(false)
const showSelectorModal = ref(false)

const { versionLabel, forceUpdate } = useAppUpdate()

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const teamActions: DropdownMenuItem[] = []

  if (store.allTeams.length > 0) {
    teamActions.push({
      label: 'Ver equipes',
      icon: 'i-heroicons-eye',
      onSelect: () => (showViewModal.value = true),
    })
  }
  if (store.availableTeams.length > 2) {
    teamActions.push({
      label: 'Escolher equipes do placar',
      icon: 'i-heroicons-arrow-path-rounded-square',
      onSelect: () => (showSelectorModal.value = true),
    })
  }
  if (store.allTeams.length > 0) {
    teamActions.push({
      label: 'Sortear novamente',
      icon: 'i-heroicons-arrow-path',
      onSelect: () => (showDrawModal.value = true),
    })
  }

  const navigation: DropdownMenuItem[] = [
    {
      label: 'Gerenciar jogadores',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/manage',
    },
  ]

  const appGroup: DropdownMenuItem[] = [
    { type: 'label', label: versionLabel },
    {
      label: 'Forçar atualização',
      icon: 'i-heroicons-arrow-down-circle',
      onSelect: () => forceUpdate(),
    },
  ]

  return [
    ...(teamActions.length > 0 ? [teamActions] : []),
    navigation,
    appGroup,
  ]
})

// Atualiza a cor do tema dinamicamente baseado na orientação
watch(
  isLandscape,
  (landscape) => {
    if (import.meta.client) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          landscape ? '#3B82F6' : '#EF4444',
        )
      }
    }
  },
  { immediate: true },
)
</script>
