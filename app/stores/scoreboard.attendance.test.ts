import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useScoreboardStore } from './scoreboard'

describe('scoreboard store: applyAttendanceList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seed() {
    const store = useScoreboardStore()
    const mercia = store.addPlayer('Mércia', 8, 'F')
    const kel = store.addPlayer('Kel', 7, 'F')
    const rafael = store.addPlayer('Rafael', 5, 'M')
    // ids de addPlayer vêm de Date.now(); força ids distintos
    mercia.id = 'mercia'
    kel.id = 'kel'
    rafael.id = 'rafael'
    kel.enabled = false
    return store
  }

  it('habilita quem está na lista, cria os novos e desabilita os ausentes', () => {
    const store = seed()

    const result = store.applyAttendanceList([
      { name: 'kel', gender: 'M' },
      { name: 'Mercia', gender: 'M' },
      { name: 'Lu', gender: 'F' },
    ])

    expect(result).toEqual({ created: 1, enabled: 2, disabled: 1 })

    const byName = Object.fromEntries(store.players.map((p) => [p.name, p]))
    expect(byName.Kel!.enabled).toBe(true)
    expect(byName['Mércia']!.enabled).toBe(true)
    expect(byName.Rafael!.enabled).toBe(false)
    expect(byName.Lu).toMatchObject({ enabled: true, gender: 'F', weight: 6 })
  })

  it('conta como desabilitado só quem estava habilitado', () => {
    const store = seed() // Kel já está desabilitado

    const result = store.applyAttendanceList([{ name: 'Lu', gender: 'F' }])

    expect(result.disabled).toBe(2) // Mércia e Rafael
  })

  it('não altera nome, nível nem gênero de quem já existe', () => {
    const store = seed()

    store.applyAttendanceList([{ name: 'MERCIA', gender: 'M' }])

    expect(store.players.find((p) => p.id === 'mercia')).toMatchObject({
      name: 'Mércia',
      weight: 8,
      gender: 'F',
    })
  })

  it('cria novos com ids únicos mesmo no mesmo milissegundo', () => {
    const store = useScoreboardStore()

    store.applyAttendanceList([
      { name: 'Ana', gender: 'F' },
      { name: 'Bia', gender: 'F' },
      { name: 'Caio', gender: 'M' },
    ])

    const ids = new Set(store.players.map((p) => p.id))
    expect(ids.size).toBe(3)
  })

  it('preserva as regras de dupla de quem foi desabilitado', () => {
    const store = seed()
    store.pairRules = [
      { id: 'r1', type: 'cannot', playerAId: 'rafael', playerBId: 'kel' },
    ]

    store.applyAttendanceList([{ name: 'Kel', gender: 'F' }])

    expect(store.pairRules).toHaveLength(1)
  })
})
