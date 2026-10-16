import { describe, expect, it } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
  migrateLegacyStorage,
} from './storageMigration'

function createStorage(initial: Record<string, unknown> = {}) {
  const data = new Map(
    Object.entries(initial).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]),
  )
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    json: (key: string) => JSON.parse(data.get(key) ?? 'null'),
    raw: (key: string) => data.get(key),
  }
}

describe('migrateLegacyStorage', () => {
  it('dobra a habilidade de jogadores e membros de equipes salvos na escala antiga', () => {
    const storage = createStorage({
      'scoreboard-players': [{ id: '1', name: 'Ana', weight: 3 }],
      'scoreboard-teams': {
        red: {
          name: 'EQUIPE 1',
          score: 2,
          members: [{ id: '1', weight: 4.5 }],
        },
        blue: { name: 'EQUIPE 2', score: 0, members: [] },
      },
      'scoreboard-all-teams': [{ name: 'EQUIPE 1', members: [{ weight: 5 }] }],
    })

    expect(migrateLegacyStorage(storage)).toBe(true)

    expect(storage.json('scoreboard-players')[0].weight).toBe(6)
    expect(storage.json('scoreboard-teams').red.members[0].weight).toBe(9)
    expect(storage.json('scoreboard-teams').red.score).toBe(2)
    expect(storage.json('scoreboard-all-teams')[0].members[0].weight).toBe(10)
    expect(storage.raw(SCHEMA_VERSION_KEY)).toBe(String(CURRENT_SCHEMA_VERSION))
  })

  it('é idempotente: não converte de novo dados já migrados', () => {
    const storage = createStorage({
      'scoreboard-players': [{ id: '1', name: 'Ana', weight: 3 }],
    })

    migrateLegacyStorage(storage)
    expect(migrateLegacyStorage(storage)).toBe(false)
    expect(storage.json('scoreboard-players')[0].weight).toBe(6)
  })

  it('mantém intacto um JSON corrompido', () => {
    const storage = createStorage({ 'scoreboard-players': '{corrompido' })

    migrateLegacyStorage(storage)
    expect(storage.raw('scoreboard-players')).toBe('{corrompido')
  })
})
