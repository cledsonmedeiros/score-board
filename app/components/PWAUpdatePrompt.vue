<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
  >
    <div
      class="rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <Icon
            v-if="offlineReady"
            name="heroicons:check-circle"
            class="h-6 w-6 text-green-500"
          />
          <Icon
            v-else
            name="heroicons:arrow-path"
            class="h-6 w-6 text-blue-500"
          />
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">
            {{ offlineReady ? 'App pronto para uso offline' : 'Nova versão disponível' }}
          </p>
          <p class="mt-1 text-sm text-gray-500">
            {{ offlineReady 
              ? 'O app agora funciona sem internet.' 
              : 'Clique em atualizar para obter a versão mais recente.' 
            }}
          </p>
        </div>

        <div class="flex flex-shrink-0 gap-2">
          <button
            v-if="needRefresh"
            @click="updateServiceWorker()"
            class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Atualizar
          </button>
          <button
            @click="close"
            class="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {{ needRefresh ? 'Depois' : 'Ok' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
