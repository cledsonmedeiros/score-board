import { describe, expect, it } from 'vitest'
import {
  createMustGroupResolver,
  findContradictoryRule,
  normalizePairRuleType,
  type PairRule,
  type PairRuleType,
} from './pairRules'

function rule(a: string, b: string, type: PairRuleType): PairRule {
  return { id: `${a}-${b}`, type, playerAId: a, playerBId: b }
}

describe('pairRules', () => {
  it('trata tipos ausentes ou desconhecidos como "cannot" (compatibilidade com dados antigos)', () => {
    expect(normalizePairRuleType(undefined)).toBe('cannot')
    expect(normalizePairRuleType('qualquer')).toBe('cannot')
    expect(normalizePairRuleType('must')).toBe('must')
  })

  it('agrupa jogadores de forma transitiva e ignora regras "cannot"', () => {
    const groupOf = createMustGroupResolver([
      rule('a', 'b', 'must'),
      rule('b', 'c', 'must'),
      rule('d', 'e', 'cannot'),
    ])

    expect(groupOf('a')).toBe(groupOf('c'))
    expect(groupOf('d')).not.toBe(groupOf('e'))
    expect(groupOf('x')).toBe('x')
  })

  it('detecta contradição indireta entre "must" e "cannot"', () => {
    const contradictory = rule('a', 'c', 'cannot')
    expect(
      findContradictoryRule([
        rule('a', 'b', 'must'),
        rule('b', 'c', 'must'),
        contradictory,
      ]),
    ).toBe(contradictory)
  })

  it('não acusa contradição quando os grupos são independentes', () => {
    expect(
      findContradictoryRule([rule('a', 'b', 'must'), rule('a', 'c', 'cannot')]),
    ).toBeNull()
  })
})
