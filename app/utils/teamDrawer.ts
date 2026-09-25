import type { Player, Team } from '../stores/scoreboard'
import {
  createMustGroupResolver,
  findContradictoryRule,
  type PairRule,
} from './pairRules'

export type DrawStrategy = 'balanced' | 'random'

/**
 * Bloco indivisível de jogadores distribuído no sorteio: um jogador sozinho
 * ou um grupo de jogadores ligados por regras de "deve jogar junto".
 */
interface PlayerUnit {
  members: Player[]
  weight: number
  maleCount: number
  femaleCount: number
}

/**
 * Monta as equipes a partir de uma lista de jogadores habilitados.
 *
 * Respeita as regras entre pares de jogadores:
 * - "não pode jogar junto": os dois nunca ficam na mesma equipe;
 * - "deve jogar junto": os jogadores (inclusive por transitividade) formam um
 *   bloco que é alocado inteiro em uma única equipe.
 *
 * Além disso, equilibra dois critérios entre as equipes:
 * - peso (nível/habilidade) de cada jogador;
 * - quantidade de homens e mulheres.
 *
 * No modo `balanced`, os blocos são distribuídos sempre para a equipe com
 * menor peso acumulado (desempate pela equipe com menos membros). No modo
 * `random`, a ordem dos blocos é embaralhada e cada um vai para a primeira
 * equipe elegível, sem considerar peso.
 */
export class TeamDrawer {
  private readonly playersPerTeam: number
  private readonly targetTeamSizes: number[]
  private readonly cannotPairLookup: Map<string, Set<string>>
  private readonly units: PlayerUnit[]

  private readonly teams: Team[]
  private readonly teamWeights: number[]
  private readonly genderCounts: { M: number[]; F: number[] }

  constructor(
    players: Player[],
    playersPerTeam: number,
    pairRules: PairRule[] = [],
  ) {
    if (players.length === 0) {
      throw new Error('Nenhum jogador habilitado para sorteio')
    }
    if (playersPerTeam < 1) {
      throw new Error('Número de jogadores por time deve ser maior que 0')
    }

    // Só valem as regras em que os dois jogadores participam deste sorteio.
    const playerIds = new Set(players.map((player) => player.id))
    const activeRules = pairRules.filter(
      (rule) => playerIds.has(rule.playerAId) && playerIds.has(rule.playerBId),
    )

    if (findContradictoryRule(activeRules)) {
      throw new Error(
        'Há regras contraditórias: jogadores que devem jogar juntos também estão marcados como "não pode jogar junto".',
      )
    }

    this.playersPerTeam = playersPerTeam
    this.targetTeamSizes = TeamDrawer.calculateTeamSizes(
      players.length,
      playersPerTeam,
    )
    this.cannotPairLookup = TeamDrawer.buildCannotPairLookup(activeRules)
    this.units = TeamDrawer.buildUnits(players, activeRules)
    this.assertUnitsFitInTeams()

    const numberOfTeams = this.targetTeamSizes.length
    this.teams = Array.from({ length: numberOfTeams }, (_, i) => ({
      name: `EQUIPE ${i + 1}`,
      score: 0,
      members: [],
    }))
    this.teamWeights = Array.from({ length: numberOfTeams }, () => 0)
    this.genderCounts = {
      M: Array.from({ length: numberOfTeams }, () => 0),
      F: Array.from({ length: numberOfTeams }, () => 0),
    }
  }

  /** Sorteia as equipes usando a estratégia informada. Pode ser chamado uma única vez por instância. */
  draw(strategy: DrawStrategy): Team[] {
    const weighted = strategy === 'balanced'

    const totalFemale = this.units.reduce(
      (sum, unit) => sum + unit.femaleCount,
      0,
    )
    const femaleTargets = this.computeGenderTargets(totalFemale)
    const maleTargets = this.targetTeamSizes.map(
      (size, i) => size - (femaleTargets[i] ?? 0),
    )

    this.resetTeams()

    const assigned = this.assignUnits(
      this.orderUnits(weighted),
      maleTargets,
      femaleTargets,
      weighted,
    )

    if (assigned) {
      return this.teams
    }

    throw new Error(
      'Não foi possível montar equipes com as restrições atuais. Revise as regras de "não pode jogar junto" e "deve jogar junto".',
    )
  }

  private resetTeams() {
    this.teams.forEach((team) => {
      team.members = []
    })
    this.teamWeights.fill(0)
    this.genderCounts.M.fill(0)
    this.genderCounts.F.fill(0)
  }

  private static calculateTeamSizes(
    totalPlayers: number,
    playersPerTeam: number,
  ): number[] {
    const completeTeams = Math.floor(totalPlayers / playersPerTeam)
    const remainder = totalPlayers % playersPerTeam

    return [
      ...Array.from({ length: completeTeams }, () => playersPerTeam),
      ...(remainder > 0 ? [remainder] : []),
    ]
  }

  private static buildCannotPairLookup(rules: PairRule[]) {
    const lookup = new Map<string, Set<string>>()

    rules.forEach((rule) => {
      if (rule.type !== 'cannot') return

      if (!lookup.has(rule.playerAId)) {
        lookup.set(rule.playerAId, new Set())
      }
      if (!lookup.has(rule.playerBId)) {
        lookup.set(rule.playerBId, new Set())
      }

      lookup.get(rule.playerAId)?.add(rule.playerBId)
      lookup.get(rule.playerBId)?.add(rule.playerAId)
    })

    return lookup
  }

  /** Agrupa os jogadores em blocos: cada grupo de "deve jogar junto" vira um bloco; os demais ficam sozinhos. */
  private static buildUnits(players: Player[], rules: PairRule[]) {
    const groupOf = createMustGroupResolver(rules)
    const unitsByGroup = new Map<string, PlayerUnit>()

    players.forEach((player) => {
      const groupId = groupOf(player.id)
      let unit = unitsByGroup.get(groupId)
      if (!unit) {
        unit = { members: [], weight: 0, maleCount: 0, femaleCount: 0 }
        unitsByGroup.set(groupId, unit)
      }

      unit.members.push(player)
      unit.weight += player.weight
      if (player.gender === 'F') {
        unit.femaleCount++
      } else {
        unit.maleCount++
      }
    })

    return [...unitsByGroup.values()]
  }

  private assertUnitsFitInTeams() {
    const oversized = this.units.find(
      (unit) => unit.members.length > this.playersPerTeam,
    )
    if (!oversized) return

    const names = oversized.members.map((member) => member.name).join(', ')
    throw new Error(
      `O grupo que deve jogar junto (${names}) tem ${oversized.members.length} jogadores, mais do que o limite de ${this.playersPerTeam} por equipe.`,
    )
  }

  private canJoinTeam(unit: PlayerUnit, teamIndex: number) {
    const team = this.teams[teamIndex]
    const maxSize = this.targetTeamSizes[teamIndex] ?? 0
    if (!team || team.members.length + unit.members.length > maxSize) {
      return false
    }

    return unit.members.every((player) => {
      const blockedPlayers = this.cannotPairLookup.get(player.id)
      if (!blockedPlayers || blockedPlayers.size === 0) return true

      return !team.members.some((member) => blockedPlayers.has(member.id))
    })
  }

  /** Calcula quantas vagas de um gênero cada equipe deve ter, proporcional ao tamanho de cada equipe. */
  private computeGenderTargets(totalOfGender: number): number[] {
    const totalCapacity = this.targetTeamSizes.reduce(
      (sum, size) => sum + size,
      0,
    )
    if (totalCapacity === 0) {
      return this.targetTeamSizes.map(() => 0)
    }

    const rawTargets = this.targetTeamSizes.map(
      (size) => (size * totalOfGender) / totalCapacity,
    )
    const targets = rawTargets.map((value) => Math.floor(value))
    let remaining =
      totalOfGender - targets.reduce((sum, value) => sum + value, 0)

    // Método dos maiores restos: distribui o que sobrou do arredondamento
    // para as equipes com a maior parte fracionária primeiro.
    const byFraction = rawTargets
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction)

    for (const { index } of byFraction) {
      if (remaining <= 0) break
      const target = targets[index]
      const teamSize = this.targetTeamSizes[index]
      if (
        target === undefined ||
        teamSize === undefined ||
        target >= teamSize
      ) {
        continue
      }
      targets[index] = target + 1
      remaining--
    }

    // Segurança para casos extremos (equipes de tamanhos bem diferentes):
    // preenche onde ainda houver vaga até esgotar o restante.
    let safety = 0
    while (remaining > 0 && safety < this.targetTeamSizes.length * 2) {
      for (let i = 0; i < targets.length && remaining > 0; i++) {
        const target = targets[i]
        const teamSize = this.targetTeamSizes[i]
        if (
          target !== undefined &&
          teamSize !== undefined &&
          target < teamSize
        ) {
          targets[i] = target + 1
          remaining--
        }
      }
      safety++
    }

    return targets
  }

  /**
   * Define a ordem de alocação dos blocos:
   * 1. blocos maiores primeiro (são os mais difíceis de encaixar);
   * 2. blocos só de mulheres por último — mantém a distribuição "homens
   *    primeiro, depois mulheres" usada para jogadores sem regra; o peso
   *    acumulado é compartilhado, então o equilíbrio vale entre todos;
   * 3. no modo balanceado, blocos mais pesados primeiro.
   * O embaralhamento inicial define a ordem entre blocos empatados.
   */
  private orderUnits(weighted: boolean) {
    const isFemaleOnly = (unit: PlayerUnit) =>
      unit.femaleCount > 0 && unit.maleCount === 0

    return [...this.units]
      .sort(() => Math.random() - 0.5)
      .sort(
        (a, b) =>
          b.members.length - a.members.length ||
          Number(isFemaleOnly(a)) - Number(isFemaleOnly(b)) ||
          (weighted ? b.weight - a.weight : 0),
      )
  }

  private placeUnit(unit: PlayerUnit, teamIndex: number, direction: 1 | -1) {
    const team = this.teams[teamIndex]
    if (!team) return

    if (direction === 1) {
      team.members.push(...unit.members.map((player) => ({ ...player })))
    } else {
      team.members.splice(team.members.length - unit.members.length)
    }

    this.teamWeights[teamIndex] =
      (this.teamWeights[teamIndex] ?? 0) + direction * unit.weight
    this.genderCounts.M[teamIndex] =
      (this.genderCounts.M[teamIndex] ?? 0) + direction * unit.maleCount
    this.genderCounts.F[teamIndex] =
      (this.genderCounts.F[teamIndex] ?? 0) + direction * unit.femaleCount
  }

  private assignUnits(
    units: PlayerUnit[],
    maleTargets: number[],
    femaleTargets: number[],
    weighted: boolean,
    unitIndex = 0,
  ): boolean {
    const unit = units[unitIndex]
    if (!unit) return true

    const teamIndexes = this.getTeamIndexesForUnit(
      unit,
      maleTargets,
      femaleTargets,
      weighted,
    )

    for (const teamIndex of teamIndexes) {
      this.placeUnit(unit, teamIndex, 1)

      if (
        this.assignUnits(
          units,
          maleTargets,
          femaleTargets,
          weighted,
          unitIndex + 1,
        )
      ) {
        return true
      }

      this.placeUnit(unit, teamIndex, -1)
    }

    return false
  }

  /** Indica se o bloco cabe na cota de gênero da equipe (só para os gêneros presentes no bloco). */
  private fitsGenderQuota(
    unit: PlayerUnit,
    teamIndex: number,
    maleTargets: number[],
    femaleTargets: number[],
  ) {
    const malesFit =
      unit.maleCount === 0 ||
      (this.genderCounts.M[teamIndex] ?? 0) + unit.maleCount <=
        (maleTargets[teamIndex] ?? 0)
    const femalesFit =
      unit.femaleCount === 0 ||
      (this.genderCounts.F[teamIndex] ?? 0) + unit.femaleCount <=
        (femaleTargets[teamIndex] ?? 0)

    return malesFit && femalesFit
  }

  private getTeamIndexesForUnit(
    unit: PlayerUnit,
    maleTargets: number[],
    femaleTargets: number[],
    weighted: boolean,
  ): number[] {
    const indexes = this.teams
      .map((_, index) => index)
      .filter((index) => this.canJoinTeam(unit, index))

    return indexes.sort((a, b) => {
      const aWithinQuota = this.fitsGenderQuota(
        unit,
        a,
        maleTargets,
        femaleTargets,
      )
      const bWithinQuota = this.fitsGenderQuota(
        unit,
        b,
        maleTargets,
        femaleTargets,
      )

      if (aWithinQuota !== bWithinQuota) return aWithinQuota ? -1 : 1
      if (!weighted) return a - b

      const weightDifference =
        (this.teamWeights[a] ?? 0) - (this.teamWeights[b] ?? 0)
      if (weightDifference !== 0) return weightDifference
      return (
        (this.teams[a]?.members.length ?? 0) -
        (this.teams[b]?.members.length ?? 0)
      )
    })
  }
}
