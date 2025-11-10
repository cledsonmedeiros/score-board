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
        `score absolute text-center text-lg font-black tracking-widest
        text-white md:text-2xl`,
        position === 'top' ? 'top-3 right-0 left-0' : 'right-0 bottom-6 left-0',
      ]"
    >
      {{ teamName }}
    </h2>

    <!-- Membros da Equipe -->
    <div
      v-if="members && members.length > 0"
      :class="[
        'absolute px-4 md:px-8',
        position === 'top'
          ? 'top-12 right-0 left-0 md:top-16'
          : 'right-0 bottom-14 left-0 md:bottom-20',
      ]"
    >
      <div
        class="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 md:gap-3"
      >
        <div
          v-for="member in members"
          :key="member.id"
          class="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm md:px-4
            md:py-1.5"
        >
          <span
            class="max-w-[120px] truncate text-xs font-semibold text-white
              md:max-w-[180px] md:text-sm"
            :title="member.name"
            >{{ member.name }}</span
          >
        </div>
      </div>
    </div>

    <!-- Pontuação -->
    <div
      class="score text-[200px] leading-none font-black text-white
        md:text-[320px]"
    >
      {{ score }}
    </div>

    <!-- Botão Decrementar -->
    <ScaleTransition>
      <button
        v-if="score > 0"
        @click.stop="$emit('decrement')"
        :class="[
          `absolute flex h-12 w-12 cursor-pointer items-center justify-center
          rounded-full border-none shadow-xl md:h-14 md:w-14`,
          position === 'top'
            ? 'bottom-4 left-4 md:bottom-6 md:left-6'
            : 'top-4 left-4 md:top-6 md:left-6',
          buttonBgColor,
          buttonHoverColor,
        ]"
      >
        <Icon
          name="heroicons:minus-20-solid"
          class="h-7 w-7 text-white md:h-8 md:w-8"
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
  position: 'top' | 'bottom'
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
