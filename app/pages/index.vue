<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden select-none">
    <!-- Equipe 1 -->
    <div
      @click="increment1"
      class="flex-1 bg-red-500 flex items-center justify-center relative cursor-pointer"
    >
      <!-- Nome da Equipe no Topo -->
      <h2
        class="score absolute top-3 left-0 right-0 text-center text-white text-lg font-black tracking-widest"
      >
        {{ teamName1 }}
      </h2>

      <!-- Pontuação Grande no Centro -->
      <div class="score text-white text-[320px] font-black leading-none">
        {{ score1 }}
      </div>

      <!-- Botão Decrementar Equipe 1 -->
      <button
        @click.stop="decrement1"
        class="absolute bottom-6 left-6 w-14 h-14 bg-red-700 hover:bg-red-800 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 border-none cursor-pointer"
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
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <button
        @click="resetScores"
        class="w-16 h-16 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 border-4 border-white cursor-pointer"
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
      class="flex-1 bg-blue-500 flex items-center justify-center relative cursor-pointer"
    >
      <!-- Pontuação Grande no Centro -->
      <div class="score text-white text-[320px] font-black leading-none">
        {{ score2 }}
      </div>

      <!-- Nome da Equipe no Fundo -->
      <h2
        class="absolute bottom-6 left-0 right-0 text-center text-white text-lg font-bold tracking-widest"
      >
        {{ teamName2 }}
      </h2>

      <!-- Botão Decrementar Equipe 2 -->
      <button
        @click.stop="decrement2"
        class="absolute top-6 left-6 w-14 h-14 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 border-none cursor-pointer"
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
const score1 = ref(0);
const score2 = ref(0);
const teamName1 = ref("EQUIPE 1");
const teamName2 = ref("EQUIPE 2");

const increment1 = () => {
  score1.value++;
};

const increment2 = () => {
  score2.value++;
};

const decrement1 = () => {
  if (score1.value > 0) {
    score1.value--;
  }
};

const decrement2 = () => {
  if (score2.value > 0) {
    score2.value--;
  }
};

const resetScores = () => {
  score1.value = 0;
  score2.value = 0;
};
</script>
