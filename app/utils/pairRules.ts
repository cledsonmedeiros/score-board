/**
 * Regras entre pares de jogadores usadas no sorteio de equipes.
 *
 * - `cannot`: os dois jogadores não podem cair na mesma equipe.
 * - `must`: os dois jogadores precisam cair na mesma equipe. A regra é
 *   transitiva: se A deve jogar com B e B deve jogar com C, então A, B e C
 *   formam um único grupo.
 */
export type PairRuleType = 'cannot' | 'must'

export interface PairRule {
  id: string
  type: PairRuleType
  playerAId: string
  playerBId: string
}

export const PAIR_RULE_LABELS: Record<PairRuleType, string> = {
  cannot: 'não pode jogar com',
  must: 'deve jogar com',
}

export function getPairKey(playerAId: string, playerBId: string) {
  return [playerAId, playerBId].sort().join('::')
}

/** Converte valores desconhecidos (dados antigos/importados) para um tipo válido; o padrão é `cannot`. */
export function normalizePairRuleType(value: unknown): PairRuleType {
  return value === 'must' ? 'must' : 'cannot'
}

/**
 * Agrupa os jogadores ligados por regras `must` (union-find) e retorna uma
 * função que devolve o identificador do grupo de um jogador. Jogadores sem
 * regra `must` formam um grupo próprio (o identificador é o próprio id).
 */
export function createMustGroupResolver(rules: readonly PairRule[]) {
  const parent = new Map<string, string>()

  const find = (playerId: string): string => {
    const current = parent.get(playerId)
    if (current === undefined || current === playerId) return playerId

    const root = find(current)
    parent.set(playerId, root)
    return root
  }

  rules.forEach((rule) => {
    if (rule.type !== 'must') return

    const rootA = find(rule.playerAId)
    const rootB = find(rule.playerBId)
    if (rootA !== rootB) parent.set(rootA, rootB)
  })

  return find
}

/**
 * Procura uma regra `cannot` entre jogadores que, pelas regras `must`
 * (inclusive transitivas), precisariam estar na mesma equipe.
 */
export function findContradictoryRule(rules: readonly PairRule[]) {
  const groupOf = createMustGroupResolver(rules)

  return (
    rules.find(
      (rule) =>
        rule.type === 'cannot' &&
        groupOf(rule.playerAId) === groupOf(rule.playerBId),
    ) ?? null
  )
}
