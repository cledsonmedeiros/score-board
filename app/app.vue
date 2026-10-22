<template>
  <UApp :locale="pt_br" :toaster="{ position: 'top-center' }">
    <NuxtPage />
    <PwaUpdateNotifier />
  </UApp>
</template>

<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale'
</script>
