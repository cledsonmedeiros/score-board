<template>
  <div class="rounded-lg border border-gray-200 p-4">
    <div class="mb-3">
      <h3 class="text-sm font-semibold text-gray-800">
        Restrições de Jogadores
      </h3>
      <p class="text-xs text-gray-600">
        Defina pares que não podem ou que devem cair na mesma equipe.
      </p>
    </div>

    <div class="mb-3 grid gap-2 md:grid-cols-[1fr_minmax(12rem,auto)_1fr_auto]">
      <USelect
        v-model="playerAId"
        :items="playerItems(store.enabledPlayers)"
        placeholder="Jogador A"
        aria-label="Jogador A"
        class="w-full"
      />
      <USelect
        v-model="ruleType"
        :items="ruleTypeItems"
        aria-label="Tipo de regra"
        class="w-full"
      />
      <USelect
        v-model="playerBId"
        :items="playerItems(availablePlayersB)"
        placeholder="Jogador B"
        aria-label="Jogador B"
        class="w-full"
      />
      <UButton
        class="justify-center"
        variant="soft"
        icon="i-heroicons-plus"
        label="Adicionar Regra"
        @click="addRule"
      />
    </div>

    <p
      v-if="rules.length === 0"
      class="rounded-lg bg-gray-50 p-3 text-xs text-gray-600"
    >
      Nenhuma restrição cadastrada.
    </p>

    <ul v-else class="max-h-40 space-y-2 overflow-y-auto">
      <li
        v-for="rule in rules"
        :key="rule.id"
        class="flex items-center justify-between gap-2 rounded-lg border
          border-gray-200 bg-white p-2"
      >
        <p class="text-sm text-gray-700">
          {{ rule.playerAName }}
          <span
            class="font-semibold"
            :class="rule.type === 'must' ? 'text-green-700' : 'text-red-700'"
          >
            {{ PAIR_RULE_LABELS[rule.type] }}
          </span>
          {{ rule.playerBName }}
        </p>
        <UButton
          color="error"
          variant="ghost"
          size="sm"
          icon="i-heroicons-trash"
          aria-label="Remover restrição"
          @click="store.removePairRule(rule.id)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/scoreboard'
import { PAIR_RULE_LABELS, type PairRuleType } from '~/utils/pairRules'

/** Cadastro das regras "deve / não pode jogar junto" entre dois jogadores. */
const store = useScoreboardStore()
const notify = useNotify()

const playerAId = ref<string>()
const playerBId = ref<string>()
const ruleType = ref<PairRuleType>('cannot')

const ruleTypeItems = (['cannot', 'must'] as const).map((value) => ({
  label: PAIR_RULE_LABELS[value],
  value,
}))

const playerItems = (players: Player[]) =>
  players.map((player) => ({ label: player.name, value: player.id }))

const availablePlayersB = computed(() =>
  store.enabledPlayers.filter((player) => player.id !== playerAId.value),
)

const rules = computed(() => {
  const playersById = new Map(store.players.map((p) => [p.id, p]))
  return store.pairRules.map((rule) => ({
    id: rule.id,
    type: rule.type,
    playerAName: playersById.get(rule.playerAId)?.name ?? 'Jogador removido',
    playerBName: playersById.get(rule.playerBId)?.name ?? 'Jogador removido',
  }))
})

const addRule = () => {
  if (!playerAId.value || !playerBId.value) {
    notify.error('Selecione os dois jogadores para adicionar a restrição.')
    return
  }

  try {
    const added = store.addPairRule(
      playerAId.value,
      playerBId.value,
      ruleType.value,
    )
    if (!added) {
      notify.error('Essa restrição já existe.')
      return
    }
    playerAId.value = undefined
    playerBId.value = undefined
  } catch (error) {
    notify.error(
      error instanceof Error
        ? error.message
        : 'Não foi possível adicionar a restrição.',
    )
  }
}
</script>
