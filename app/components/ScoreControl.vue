<template>
  <div
    v-if="matchHasScore"
    class="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2
      items-center justify-between gap-6 rounded-full border border-white/20
      bg-white/10 p-4 shadow-xl backdrop-blur-md sm:gap-4 sm:p-3"
  >
    <button
      :class="[btnConfig.base, btnConfig.red]"
      :disabled="!redTeamHasScore"
      @click="store.decrementTeamScore(0)"
    >
      <Icon
        name="heroicons:minus-20-solid"
        class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
      />
    </button>

    <button
      @click="handleResetScores()"
      :class="[btnConfig.base, btnConfig.reset]"
    >
      <Icon
        name="heroicons:arrow-path"
        class="h-6 w-6 text-white sm:h-8 sm:w-8 landscape:h-7 landscape:w-7"
      />
    </button>

    <button
      :class="[btnConfig.base, btnConfig.blue]"
      :disabled="!blueTeamHasScore"
      @click="store.decrementTeamScore(1)"
    >
      <Icon
        name="heroicons:minus-20-solid"
        class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()

const btnConfig = {
  base: 'border-2 border-white flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-xl transition-all duration-200',
  red: 'bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600',
  blue: 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600',
  reset: 'bg-gray-700 hover:bg-gray-600',
}

const redTeamHasScore = computed(() => {
  if (!store.teams.length) {
    return false
  }

  const team = store.teams[0]

  if (!team) {
    return false
  }

  return team.score > 0
})

const blueTeamHasScore = computed(() => {
  if (!store.teams.length) {
    return false
  }

  const team = store.teams[1]

  if (!team) {
    return false
  }

  return team.score > 0
})

const matchHasScore = computed(() => {
  return redTeamHasScore.value || blueTeamHasScore.value
})

const handleResetScores = () => {
  if (confirm('Resetar placar?')) {
    store.resetScores()
  }
}
</script>
