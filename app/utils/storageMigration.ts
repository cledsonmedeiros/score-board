import { migrateLegacySkill } from './playerProfile'

export const SCHEMA_VERSION_KEY = 'scoreboard-schema-version'
/** v1: habilidade 1–5 (sem chave de versão). v2: habilidade 1–10 e posições. */
export const CURRENT_SCHEMA_VERSION = 2

/** Chaves do localStorage que guardam jogadores com o campo `weight`. */
export const PLAYER_STORAGE_KEYS = {
  players: 'scoreboard-players',
  teams: 'scoreboard-teams',
  allTeams: 'scoreboard-all-teams',
} as const

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * Converte os dados salvos na escala antiga (1–5) para a nova (1–10).
 *
 * Idempotente: a versão do schema é gravada ao final, então rodar de novo
 * não multiplica os pesos uma segunda vez. Se um JSON estiver corrompido,
 * ele é mantido como está (o carregamento do store já trata esse caso).
 */
export function migrateLegacyStorage(storage: KeyValueStorage) {
  const storedVersion = Number(storage.getItem(SCHEMA_VERSION_KEY) ?? 1)
  if (storedVersion >= CURRENT_SCHEMA_VERSION) return false

  Object.values(PLAYER_STORAGE_KEYS).forEach((key) => {
    const raw = storage.getItem(key)
    if (!raw) return

    try {
      storage.setItem(key, JSON.stringify(migrateWeights(JSON.parse(raw))))
    } catch {
      // JSON inválido: deixa como está.
    }
  })

  storage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
  return true
}

/** Percorre jogadores, listas de equipes ou `{ red, blue }` e converte todo `weight` numérico encontrado em jogadores. */
function migrateWeights(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(migrateWeights)
  if (!value || typeof value !== 'object') return value

  const record = value as Record<string, unknown>

  if (Array.isArray(record.members)) {
    return { ...record, members: record.members.map(migrateWeights) }
  }
  if (typeof record.weight === 'number') {
    return { ...record, weight: migrateLegacySkill(record.weight) }
  }
  if ('red' in record || 'blue' in record) {
    return Object.fromEntries(
      Object.entries(record).map(([key, team]) => [key, migrateWeights(team)]),
    )
  }
  return value
}
