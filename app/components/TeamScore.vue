<template>
  <div
    v-if="team"
    @click="store.incrementTeamScore(teamIndex)"
    :class="[
      'relative flex flex-1 cursor-pointer items-center justify-center',
      bgColor,
    ]"
  >
    <!-- Nome da Equipe -->
    <h2
      :class="[
        `score absolute text-center text-base font-black tracking-widest
        text-white sm:text-lg md:text-2xl`,
        position === 'top'
          ? 'left-0 right-0 top-2 sm:top-3'
          : 'bottom-4 left-0 right-0 sm:bottom-6',
      ]"
    >
      {{ team.name }}
    </h2>

    <!-- Membros da Equipe -->
    <div
      v-if="team.members && team.members.length > 0"
      :class="[
        'absolute px-3 sm:px-4 md:px-8',
        position === 'top'
          ? 'left-0 right-0 top-8 sm:top-12 md:top-16'
          : 'bottom-10 left-0 right-0 sm:bottom-14 md:bottom-20',
      ]"
    >
      <div
        class="mx-auto flex max-w-4xl flex-wrap justify-center gap-1.5 sm:gap-2
          md:gap-3"
      >
        <div
          v-for="member in team.members"
          :key="member.id"
          class="rounded-full bg-white/20 px-2 py-0.5 backdrop-blur-sm sm:px-3
            sm:py-1 md:px-4 md:py-1.5"
        >
          <span
            class="max-w-20 truncate text-[10px] font-semibold text-white
              sm:max-w-[120px] sm:text-xs md:max-w-[180px] md:text-sm"
            :title="member.name"
            >{{ member.name }}</span
          >
        </div>
      </div>
    </div>

    <!-- Pontuação -->
    <Transition name="score-change" mode="out-in">
      <div
        :key="team.score"
        class="score text-[11rem] font-black leading-none text-white
          sm:text-[12.5rem]"
      >
        {{ team.score }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const store = useScoreboardStore()
const { isLandscape } = useOrientation()

interface Props {
  teamIndex: number
}

const props = defineProps<Props>()

const team = computed(() => store.teams[props.teamIndex])
const bgColor = computed(() =>
  props.teamIndex === 0 ? 'bg-red-500' : 'bg-blue-500',
)
const position = computed(() => {
  if (props.teamIndex === 0) {
    return isLandscape.value ? 'left' : 'top'
  } else {
    return isLandscape.value ? 'right' : 'bottom'
  }
})
</script>

<style scoped>
.score-change-enter-active {
  transition: all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-change-leave-active {
  transition: all 0.1s ease-in;
}

.score-change-enter-from {
  transform: scale(0.5);
  opacity: 0;
}

.score-change-leave-to {
  transform: scale(1.5);
  opacity: 0;
}
</style>
