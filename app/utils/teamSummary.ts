import type { Team } from '~/stores/scoreboard'
import { POSITIONS, POSITION_LABELS } from './playerProfile'

/** Dica (title) que explica as siglas de `positionSummary`. */
export const POSITION_SUMMARY_TITLE = POSITIONS.map(
  (position) => POSITION_LABELS[position].full,
).join(' · ')

/** Ex.: "LEV 1 · REC 0 · ATA 4". */
export const positionSummary = (team: Team) =>
  POSITIONS.map(
    (position) =>
      `${POSITION_LABELS[position].short} ${
        team.members.filter((member) => member.positions?.[position]).length
      }`,
  ).join(' · ')

/** Ex.: "♂ 3 · ♀ 1". */
export const genderSummary = (team: Team) => {
  const femaleCount = team.members.filter((m) => m.gender === 'F').length
  return `♂ ${team.members.length - femaleCount} · ♀ ${femaleCount}`
}

/** Soma dos níveis da equipe, com uma casa decimal. */
export const teamWeight = (team: Team) =>
  team.members.reduce((sum, member) => sum + member.weight, 0).toFixed(1)
