/**
 * Regras de domínio do perfil de um jogador: escala de habilidade (peso) e
 * posições que ele sabe jogar. Centraliza validação/normalização para que
 * cadastro, importação e armazenamento local usem exatamente as mesmas regras.
 */

export const SKILL_MIN = 1
export const SKILL_MAX = 10
export const SKILL_STEP = 0.5
export const SKILL_DEFAULT = 6

/** Escala usada até a introdução da escala 1–10 (dados salvos e QR codes antigos). */
export const LEGACY_SKILL_MAX = 5

export const POSITIONS = ['setter', 'receiver', 'attacker'] as const
export type Position = (typeof POSITIONS)[number]

export type PlayerPositions = Record<Position, boolean>

export const POSITION_LABELS: Record<
  Position,
  { short: string; full: string }
> = {
  setter: { short: 'LEV', full: 'Levantador' },
  receiver: { short: 'REC', full: 'Recepcionador' },
  attacker: { short: 'ATA', full: 'Atacante' },
}

/** Limita à escala válida e arredonda para o passo de 0.5. Valores inválidos viram o padrão. */
export function normalizeSkill(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return SKILL_DEFAULT
  }

  const snapped = Math.round(value / SKILL_STEP) * SKILL_STEP
  return Math.min(SKILL_MAX, Math.max(SKILL_MIN, snapped))
}

/** Converte um valor da escala antiga (1–5) para a escala atual (1–10). */
export function migrateLegacySkill(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return SKILL_DEFAULT
  }

  return normalizeSkill(value * (SKILL_MAX / LEGACY_SKILL_MAX))
}

export function emptyPositions(): PlayerPositions {
  return { setter: false, receiver: false, attacker: false }
}

/** Aceita apenas booleanos explícitos; qualquer outro valor conta como "não joga na posição". */
export function normalizePositions(value: unknown): PlayerPositions {
  const positions = emptyPositions()
  if (!value || typeof value !== 'object') return positions

  const raw = value as Record<string, unknown>
  POSITIONS.forEach((position) => {
    positions[position] = raw[position] === true
  })
  return positions
}
