import { describe, expect, it } from 'vitest'
import type { PairRule } from './pairRules'
import {
  findDuplicateGroups,
  mergeMembers,
  mergePairRules,
} from './mergeDuplicates'

const player = (id: string, name: string, createdAt = 0) => ({
  id,
  name,
  createdAt,
})

const rule = (
  id: string,
  type: PairRule['type'],
  playerAId: string,
  playerBId: string,
): PairRule => ({ id, type, playerAId, playerBId })

describe('findDuplicateGroups', () => {
  it('agrupa nomes com a mesma chave, do mais antigo para o mais novo', () => {
    const groups = findDuplicateGroups([
      player('a2', 'Ana ✅', 20),
      player('b', 'Bia', 5),
      player('a1', 'ana', 10),
      player('a3', '~ Ána', 30),
    ])

    expect(groups.map((group) => group.map((p) => p.id))).toEqual([
      ['a1', 'a2', 'a3'],
    ])
  })

  it('não cria grupo para nomes únicos', () => {
    expect(
      findDuplicateGroups([player('a', 'Ana'), player('b', 'Ana Paula')]),
    ).toEqual([])
  })

  it('mantém a ordem de aparição entre os grupos', () => {
    const groups = findDuplicateGroups([
      player('b1', 'Bia'),
      player('a1', 'Ana'),
      player('b2', 'BIA'),
      player('a2', 'Ana.'),
    ])

    expect(groups.map((group) => group[0]!.id)).toEqual(['b1', 'a1'])
  })
})

describe('mergePairRules', () => {
  it('passa as regras dos removidos para quem fica', () => {
    const result = mergePairRules(
      [rule('r1', 'cannot', 'dup', 'bia')],
      'keep',
      ['dup'],
    )

    expect(result.rules).toEqual([rule('r1', 'cannot', 'keep', 'bia')])
    expect(result.dropped).toEqual([])
  })

  it('descarta regra do jogador com ele mesmo', () => {
    const result = mergePairRules([rule('r1', 'must', 'keep', 'dup')], 'keep', [
      'dup',
    ])

    expect(result.rules).toEqual([])
    expect(result.dropped).toEqual([])
  })

  it('descarta em silêncio regra repetida do mesmo tipo', () => {
    const result = mergePairRules(
      [rule('r1', 'cannot', 'keep', 'bia'), rule('r2', 'cannot', 'bia', 'dup')],
      'keep',
      ['dup'],
    )

    expect(result.rules).toEqual([rule('r1', 'cannot', 'keep', 'bia')])
    expect(result.dropped).toEqual([])
  })

  it('em regra oposta, vale a de quem fica e a outra é reportada', () => {
    const result = mergePairRules(
      [rule('r1', 'must', 'keep', 'bia'), rule('r2', 'cannot', 'dup', 'bia')],
      'keep',
      ['dup'],
    )

    expect(result.rules).toEqual([rule('r1', 'must', 'keep', 'bia')])
    expect(result.dropped).toEqual([rule('r2', 'cannot', 'keep', 'bia')])
  })

  it('reporta regra que contradiz por transitividade', () => {
    // keep deve jogar com Bia, Bia deve jogar com Caio; dup não pode com Caio
    const result = mergePairRules(
      [
        rule('r1', 'must', 'keep', 'bia'),
        rule('r2', 'must', 'bia', 'caio'),
        rule('r3', 'cannot', 'dup', 'caio'),
      ],
      'keep',
      ['dup'],
    )

    expect(result.rules.map((r) => r.id)).toEqual(['r1', 'r2'])
    expect(result.dropped.map((r) => r.id)).toEqual(['r3'])
  })

  it('não mexe em regras de outros jogadores', () => {
    const untouched = rule('r1', 'cannot', 'bia', 'caio')
    const result = mergePairRules([untouched], 'keep', ['dup'])

    expect(result.rules).toEqual([untouched])
  })
})

describe('mergeMembers', () => {
  const keep = { id: 'keep', name: 'Ana' }

  it('troca a cópia do removido por quem fica', () => {
    expect(
      mergeMembers(
        [
          { id: 'bia', name: 'Bia' },
          { id: 'dup', name: 'Ana ✅' },
        ],
        keep,
        ['dup'],
      ),
    ).toEqual([{ id: 'bia', name: 'Bia' }, keep])
  })

  it('atualiza a cópia de quem fica com os dados atuais', () => {
    expect(mergeMembers([{ id: 'keep', name: 'antigo' }], keep, [])).toEqual([
      keep,
    ])
  })

  it('deixa um só quando os dois estavam no mesmo time', () => {
    expect(
      mergeMembers(
        [
          { id: 'dup', name: 'Ana ✅' },
          { id: 'keep', name: 'Ana' },
        ],
        keep,
        ['dup'],
      ),
    ).toEqual([keep])
  })

  it('devolve o mesmo array quando ninguém do grupo está no time', () => {
    const members = [{ id: 'bia', name: 'Bia' }]
    expect(mergeMembers(members, keep, ['dup'])).toBe(members)
  })
})
