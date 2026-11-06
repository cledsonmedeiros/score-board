/**
 * Mesclagem de jogadores duplicados (mesmo nome pela chave da lista de
 * presença). Funções puras; quem aplica o resultado é a store.
 */
import { attendanceMatchKey } from './attendanceList'
import { findContradictoryRule, getPairKey, type PairRule } from './pairRules'

/**
 * Grupos de jogadores com a mesma chave de nome (2 ou mais por grupo). Cada
 * grupo vem do cadastro mais antigo para o mais novo; os grupos seguem a
 * ordem em que o primeiro nome aparece na lista.
 */
export function findDuplicateGroups<
  T extends { id: string; name: string; createdAt: number },
>(players: readonly T[]): T[][] {
  const byKey = new Map<string, T[]>()
  players.forEach((player) => {
    const key = attendanceMatchKey(player.name)
    if (!key) return
    const group = byKey.get(key)
    if (group) group.push(player)
    else byKey.set(key, [player])
  })

  return [...byKey.values()]
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort((a, b) => a.createdAt - b.createdAt))
}

/**
 * Passa as regras dos removidos para `keepId`. Regras do jogador com ele
 * mesmo e repetidas do mesmo tipo somem em silêncio. Se a regra herdada
 * contradiz uma que já existe (oposta ou por transitividade), vale a
 * existente e a herdada volta em `dropped`, já com o id de quem fica.
 */
export function mergePairRules(
  rules: readonly PairRule[],
  keepId: string,
  removeIds: readonly string[],
): { rules: PairRule[]; dropped: PairRule[] } {
  const removed = new Set(removeIds)
  const touchesRemoved = (rule: PairRule) =>
    removed.has(rule.playerAId) || removed.has(rule.playerBId)
  const remap = (id: string) => (removed.has(id) ? keepId : id)

  const result = rules.filter((rule) => !touchesRemoved(rule))
  const dropped: PairRule[] = []

  rules.filter(touchesRemoved).forEach((original) => {
    const rule: PairRule = {
      ...original,
      playerAId: remap(original.playerAId),
      playerBId: remap(original.playerBId),
    }
    if (rule.playerAId === rule.playerBId) return

    const pairKey = getPairKey(rule.playerAId, rule.playerBId)
    const samePair = result.find(
      (other) => getPairKey(other.playerAId, other.playerBId) === pairKey,
    )
    if (samePair) {
      if (samePair.type !== rule.type) dropped.push(rule)
      return
    }

    if (findContradictoryRule([...result, rule])) {
      dropped.push(rule)
      return
    }

    result.push(rule)
  })

  return { rules: result, dropped }
}

/**
 * Troca, num time salvo, as cópias dos removidos pela versão atual de quem
 * fica, sem repetir o jogador. Sem ninguém do grupo, devolve o mesmo array.
 */
export function mergeMembers<T extends { id: string }>(
  members: readonly T[],
  keep: T,
  removeIds: readonly string[],
): T[] {
  const group = new Set([keep.id, ...removeIds])
  if (!members.some((member) => group.has(member.id))) return members as T[]

  let placed = false
  return members.flatMap((member) => {
    if (!group.has(member.id)) return [member]
    if (placed) return []
    placed = true
    return [keep]
  })
}
