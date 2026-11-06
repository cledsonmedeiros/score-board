import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useScoreboardStore } from './scoreboard'

describe('scoreboard store: mergeDuplicatePlayers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seed() {
    const store = useScoreboardStore()
    const ana = store.addPlayer('Ana', 8, 'F')
    const anaDup = store.addPlayer('Ana ✅', 5, 'F')
    const bia = store.addPlayer('Bia', 6, 'F')
    const caio = store.addPlayer('Caio', 7, 'M')
    // ids de addPlayer vêm de Date.now(); força ids e datas distintos
    Object.assign(ana, { id: 'ana', createdAt: 1, enabled: false })
    Object.assign(anaDup, { id: 'anaDup', createdAt: 2, enabled: true })
    Object.assign(bia, { id: 'bia', createdAt: 3 })
    Object.assign(caio, { id: 'caio', createdAt: 4 })
    return store
  }

  it('expõe os grupos de duplicatas', () => {
    const store = seed()
    expect(
      store.duplicateGroups.map((group) => group.map((p) => p.id)),
    ).toEqual([['ana', 'anaDup']])
  })

  it('remove os duplicados, mantém os dados de quem fica e habilita se algum estava', () => {
    const store = seed()

    const result = store.mergeDuplicatePlayers([
      { keepId: 'ana', removeIds: ['anaDup'] },
    ])

    expect(result).toEqual({ groups: 1, removed: 1, droppedRules: [] })
    expect(store.players.map((p) => p.id)).toEqual(['ana', 'bia', 'caio'])
    expect(store.players[0]).toMatchObject({
      name: 'Ana',
      weight: 8,
      enabled: true,
    })
    expect(store.duplicateGroups).toEqual([])
  })

  it('herda as regras e reporta as que conflitam com as de quem fica', () => {
    const store = seed()
    store.addPairRule('ana', 'bia', 'must')
    store.addPairRule('anaDup', 'bia', 'cannot')
    store.addPairRule('anaDup', 'caio', 'cannot')

    const result = store.mergeDuplicatePlayers([
      { keepId: 'ana', removeIds: ['anaDup'] },
    ])

    expect(
      store.pairRules.map((r) => [r.type, r.playerAId, r.playerBId]),
    ).toEqual([
      ['must', 'ana', 'bia'],
      ['cannot', 'ana', 'caio'],
    ])
    expect(result.droppedRules).toEqual(['Ana não pode jogar com Bia'])
  })

  it('troca o duplicado pelos dados de quem fica nos times salvos', () => {
    const store = seed()
    const [ana, anaDup, bia] = store.players
    store.teams.red.members = [{ ...anaDup! }, { ...bia! }]
    store.teams.blue.members = [{ ...ana! }, { ...anaDup! }]
    store.allTeams = [{ name: 'EQUIPE 3', score: 0, members: [{ ...anaDup! }] }]

    store.mergeDuplicatePlayers([{ keepId: 'ana', removeIds: ['anaDup'] }])

    expect(store.teams.red.members.map((m) => m.id)).toEqual(['ana', 'bia'])
    expect(store.teams.red.members[0]!.name).toBe('Ana')
    expect(store.teams.blue.members.map((m) => m.id)).toEqual(['ana'])
    expect(store.allTeams[0]!.members.map((m) => m.id)).toEqual(['ana'])
  })

  it('ignora grupo cujo jogador escolhido não existe', () => {
    const store = seed()

    const result = store.mergeDuplicatePlayers([
      { keepId: 'sumiu', removeIds: ['anaDup'] },
    ])

    expect(result).toEqual({ groups: 0, removed: 0, droppedRules: [] })
    expect(store.players).toHaveLength(4)
  })
})
