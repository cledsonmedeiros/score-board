<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden select-none">
    <!-- Equipe 1 -->
    <div
      @click="increment1"
      class="relative flex flex-1 cursor-pointer items-center justify-center
        bg-red-500"
    >
      <!-- Nome da Equipe no Topo -->
      <h2
        class="score absolute top-3 right-0 left-0 text-center text-lg
          font-black tracking-widest text-white"
      >
        {{ teamName1 }}
      </h2>

      <!-- Pontuação Grande no Centro -->
      <div class="score text-[320px] leading-none font-black text-white">
        {{ score1 }}
      </div>

      <!-- Botão Decrementar Equipe 1 -->
      <button
        @click.stop="decrement1"
        class="absolute bottom-6 left-6 flex h-14 w-14 cursor-pointer
          items-center justify-center rounded-full border-none bg-red-700
          shadow-xl transition-all duration-200 hover:bg-red-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
        </svg>
      </button>
    </div>

    <!-- Botão Reset no Centro -->
    <div
      class="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
    >
      <button
        @click="resetScores"
        class="flex h-16 w-16 cursor-pointer items-center justify-center
          rounded-full border-4 border-white bg-gray-600 shadow-xl
          transition-all duration-200 hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>

    <!-- Equipe 2 -->
    <div
      @click="increment2"
      class="relative flex flex-1 cursor-pointer items-center justify-center
        bg-blue-500"
    >
      <!-- Pontuação Grande no Centro -->
      <div class="score text-[320px] leading-none font-black text-white">
        {{ score2 }}
      </div>

      <!-- Nome da Equipe no Fundo -->
      <h2
        class="absolute right-0 bottom-6 left-0 text-center text-lg font-bold
          tracking-widest text-white"
      >
        {{ teamName2 }}
      </h2>

      <!-- Botão Decrementar Equipe 2 -->
      <button
        v-if="score2 > 0"
        @click.stop="decrement2"
        class="absolute top-6 left-6 flex h-14 w-14 cursor-pointer items-center
          justify-center rounded-full border-none bg-blue-700 shadow-xl
          transition-all duration-200 hover:bg-blue-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const score1 = ref(0)
const score2 = ref(0)
const teamName1 = ref('EQUIPE 1')
const teamName2 = ref('EQUIPE 2')

const increment1 = () => {
  score1.value++
}

const increment2 = () => {
  score2.value++
}

const decrement1 = () => {
  if (score1.value > 0) {
    score1.value--
  }
}

const decrement2 = () => {
  if (score2.value > 0) {
    score2.value--
  }
}

const resetScores = () => {
  score1.value = 0
  score2.value = 0
}
</script>
