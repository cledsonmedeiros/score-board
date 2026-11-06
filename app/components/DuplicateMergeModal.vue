<template>
  <AppSheet
    ref="sheet"
    title="Mesclar duplicatas"
    description="Escolha qual cadastro fica em cada grupo. Os outros são removidos e as regras de dupla passam para o que fica."
    @close="emit('close')"
  >
    <div class="flex flex-col gap-3">
      <section
        v-for="group in groups"
        :key="group.players[0]!.id"
        class="rounded-lg border border-gray-200 bg-white"
        :class="{ 'opacity-50': group.skip }"
      >
        <URadioGroup
          v-model="group.keepId"
          :disabled="group.skip"
          :items="group.players.map(toRadioItem)"
          class="p-3"
        />
        <div class="border-t border-gray-100 px-3 py-2">
          <UCheckbox
            v-model="group.skip"
            label="São pessoas diferentes, não mesclar"
          />
        </div>
      </section>
    </div>

    <template #footer>
      <div class="grid w-full grid-cols-2 gap-2">
        <UButton
          class="justify-center"
          color="neutral"
          variant="outline"
          label="Cancelar"
          @click="sheet?.close()"
        />
        <UButton
          class="justify-center"
          color="success"
          :disabled="selected.length === 0"
          :label="`Mesclar ${selected.length} grupo${selected.length === 1 ? '' : 's'}`"
          @click="handleConfirm"
        />
      </div>
    </template>
  </AppSheet>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'

const emit = defineEmits<{ close: [] }>()

const store = useScoreboardStore()
const notify = useNotify()
const sheet = ref<{ close: () => void } | null>(null)

/** Cópia local: o mais antigo vem marcado, e nada muda até confirmar. */
const groups = ref(
  store.duplicateGroups.map((players) => ({
    players,
    keepId: players[0]!.id,
    skip: false,
  })),
)

const selected = computed(() => groups.value.filter((group) => !group.skip))

const toRadioItem = (player: Player) => ({
  value: player.id,
  label: player.name,
  description: [
    `Nível ${player.weight.toLocaleString('pt-BR')}`,
    player.gender === 'F' ? 'Feminino' : 'Masculino',
    player.enabled ? 'habilitado' : 'desabilitado',
  ].join(' · '),
})

const handleConfirm = () => {
  const result = store.mergeDuplicatePlayers(
    selected.value.map((group) => ({
      keepId: group.keepId,
      removeIds: group.players
        .map((player) => player.id)
        .filter((id) => id !== group.keepId),
    })),
  )

  notify.success(
    `${result.removed} cadastro${result.removed === 1 ? '' : 's'} ` +
      `duplicado${result.removed === 1 ? '' : 's'} removido${result.removed === 1 ? '' : 's'}.`,
  )
  if (result.droppedRules.length > 0) {
    notify.error(
      `Regras descartadas por conflito: ${result.droppedRules.join('; ')}.`,
    )
  }
  sheet.value?.close()
}
</script>
