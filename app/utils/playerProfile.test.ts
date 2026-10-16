import { describe, expect, it } from 'vitest'
import {
  SKILL_DEFAULT,
  migrateLegacySkill,
  normalizePositions,
  normalizeSkill,
} from './playerProfile'

describe('normalizeSkill', () => {
  it.each([
    [7.5, 7.5],
    [7.3, 7.5],
    [0, 1],
    [11, 10],
    [Number.NaN, SKILL_DEFAULT],
    ['8', SKILL_DEFAULT],
    [undefined, SKILL_DEFAULT],
  ])('normaliza %s para %s', (input, expected) => {
    expect(normalizeSkill(input)).toBe(expected)
  })
})

describe('migrateLegacySkill', () => {
  it.each([
    [1, 2],
    [3, 6],
    [4.5, 9],
    [5, 10],
  ])('converte %s (escala 1–5) para %s (escala 1–10)', (input, expected) => {
    expect(migrateLegacySkill(input)).toBe(expected)
  })
})

describe('normalizePositions', () => {
  it('considera apenas booleanos verdadeiros explícitos', () => {
    expect(
      normalizePositions({ setter: true, receiver: 'true', extra: true }),
    ).toEqual({ setter: true, receiver: false, attacker: false })
  })

  it('retorna todas desmarcadas para valores ausentes', () => {
    expect(normalizePositions(undefined)).toEqual({
      setter: false,
      receiver: false,
      attacker: false,
    })
  })
})
