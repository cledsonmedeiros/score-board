<template>
  <div
    v-if="matchHasScore"
    class="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2
      items-center justify-between gap-6 rounded-full bg-white/10 p-4 shadow-xl
      backdrop-blur-md border border-white/20"
  >
    <button
      :class="[
        `flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
        border-none shadow-xl sm:h-12 sm:w-12 md:h-14 md:w-14`,
        btnConfig.red,
      ]"
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
      class="flex h-12 w-12 cursor-pointer items-center justify-center
        rounded-full border-2 border-white bg-gray-700 shadow-xl transition-all
        duration-200 hover:bg-gray-600 sm:h-16 sm:w-16 landscape:h-14
        landscape:w-14"
    >
      <Icon
        name="heroicons:arrow-path"
        class="h-6 w-6 text-white sm:h-8 sm:w-8 landscape:h-7 landscape:w-7"
      />
    </button>

    <button
      :class="[
        `flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
        border-none shadow-xl sm:h-12 sm:w-12 md:h-14 md:w-14`,
        btnConfig.blue,
      ]"
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
  red: 'bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600',
  blue: 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600',
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
