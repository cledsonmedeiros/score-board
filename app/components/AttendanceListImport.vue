<template>
  <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
    <label class="mb-2 block text-xs font-semibold text-gray-700">
      Lista de presença (WhatsApp ou um nome por linha)
    </label>

    <template v-if="!preview">
      <p class="mb-2 text-xs text-gray-500">
        Cole a lista do grupo: as linhas numeradas viram jogadores e o título é
        ignorado. Quem está na lista fica habilitado, quem não está fica
        desabilitado, e quem não existe é criado com nível padrão.
      </p>
      <UTextarea
        v-model="text"
        :rows="6"
        placeholder="Vôlei sexta 21h

1. Ana
2. Bruno
3. Carla"
        class="w-full"
        :ui="{ base: 'resize-none' }"
      />
      <UButton
        block
        class="mt-3"
        color="success"
        label="Revisar lista"
        :disabled="!text.trim()"
        @click="handleReview"
      />
    </template>

    <template v-else>
      <p class="mb-2 text-xs text-gray-500">
        {{ preview.entries.length }} na lista · {{ newCount }} novo{{
          newCount === 1 ? '' : 's'
        }}. Ajuste o gênero dos novos antes de confirmar.
      </p>

      <ul
        class="max-h-72 divide-y divide-gray-200 overflow-y-auto rounded-lg
          border border-gray-200 bg-white"
      >
        <li
          v-for="(entry, index) in preview.entries"
          :key="entry.name"
          class="flex items-center gap-2 px-3 py-2"
        >
          <span class="min-w-0 flex-1 truncate text-sm text-gray-800">
            {{ entry.name }}
          </span>
          <template v-if="entry.existingId">
            <UBadge color="neutral" variant="subtle" label="já cadastrado" />
          </template>
          <template v-else>
            <UBadge color="success" variant="subtle" label="novo" />
            <GenderToggle
              :model-value="entry.gender"
              size="sm"
              @update="preview.entries[index]!.gender = $event"
            />
          </template>
        </li>
      </ul>

      <p v-if="disabledNames.length > 0" class="mt-2 text-xs text-amber-700">
        Serão desabilitados ({{ disabledNames.length }}):
        {{ disabledNames.join(', ') }}
      </p>

      <div class="mt-3 flex gap-2">
        <UButton
          class="flex-1 justify-center"
          color="neutral"
          variant="outline"
          label="Voltar"
          @click="preview = null"
        />
        <UButton
          class="flex-1 justify-center"
          color="success"
          label="Confirmar presença"
          @click="handleConfirm"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Gender } from '~/stores/scoreboard'
import { parseAttendanceList, planAttendance } from '~/utils/attendanceList'

const emit = defineEmits<{
  feedback: [type: 'success' | 'error', message: string]
}>()

interface PreviewEntry {
  name: string
  existingId: string | null
  gender: Gender
}

const store = useScoreboardStore()
const text = ref('')
const preview = ref<{ entries: PreviewEntry[]; disableIds: string[] } | null>(
  null,
)

const newCount = computed(
  () => preview.value?.entries.filter((entry) => !entry.existingId).length ?? 0,
)

const disabledNames = computed(() => {
  const ids = new Set(preview.value?.disableIds ?? [])
  return store.players
    .filter((player) => ids.has(player.id) && player.enabled)
    .map((player) => player.name)
})

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

const handleReview = () => {
  const names = parseAttendanceList(text.value)
  if (names.length === 0) {
    emit('feedback', 'error', 'Nenhum nome encontrado no texto colado.')
    return
  }

  const plan = planAttendance(store.players, names)
  preview.value = {
    entries: plan.entries.map((entry) => ({ ...entry, gender: 'M' })),
    disableIds: plan.disableIds,
  }
}

const handleConfirm = () => {
  if (!preview.value) return

  const result = store.applyAttendanceList(
    preview.value.entries.map(({ name, gender }) => ({ name, gender })),
  )
  text.value = ''
  preview.value = null

  emit(
    'feedback',
    'success',
    `Lista aplicada: ${plural(result.created, 'novo')}, ` +
      `${plural(result.enabled, 'habilitado')}, ` +
      `${plural(result.disabled, 'desabilitado')}.`,
  )
}
</script>
