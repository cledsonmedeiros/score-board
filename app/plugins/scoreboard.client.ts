export default defineNuxtPlugin(() => {
  const scoreboardStore = useScoreboardStore()

  if (import.meta.client) {
    scoreboardStore.init()
  }
})
