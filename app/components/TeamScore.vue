<template>
  <div
    @click="$emit('increment')"
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
      {{ teamName }}
    </h2>

    <!-- Membros da Equipe -->
    <div
      v-if="members && members.length > 0"
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
          v-for="member in members"
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
    <div
      class="score text-[120px] font-black leading-none text-white
        sm:text-[200px] md:text-[320px] landscape:text-[140px]
        landscape:sm:text-[180px]"
    >
      {{ score }}
    </div>

    <!-- Botão Decrementar -->
    <ScaleTransition>
      <button
        v-if="score > 0"
        @click.stop="$emit('decrement')"
        :class="[
          `absolute flex h-10 w-10 cursor-pointer items-center justify-center
          rounded-full border-none shadow-xl sm:h-12 sm:w-12 md:h-14 md:w-14`,
          position === 'top'
            ? 'bottom-2 left-2 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6'
            : position === 'bottom'
              ? 'left-2 top-2 sm:left-4 sm:top-4 md:left-6 md:top-6'
              : position === 'left'
                ? 'right-2 top-2 sm:right-4 sm:top-4 md:right-6 md:top-6'
                : 'left-2 top-2 sm:left-4 sm:top-4 md:left-6 md:top-6',
          buttonBgColor,
          buttonHoverColor,
        ]"
      >
        <Icon
          name="heroicons:minus-20-solid"
          class="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
        />
      </button>
    </ScaleTransition>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'

interface Props {
  teamName: string
  score: number
  position: 'top' | 'bottom' | 'left' | 'right'
  members?: Player[]
  bgColor?: string
  buttonBgColor?: string
  buttonHoverColor?: string
}

withDefaults(defineProps<Props>(), {
  bgColor: 'bg-blue-500',
  buttonBgColor: 'bg-blue-700',
  buttonHoverColor: 'hover:bg-blue-800',
  members: () => [],
})

defineEmits<{
  increment: []
  decrement: []
}>()
</script>
