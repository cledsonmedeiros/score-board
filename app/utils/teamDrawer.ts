import type { CannotPairRule, Player, Team } from '~/stores/scoreboard'

export type DrawStrategy = 'balanced' | 'random'

export function getPairKey(playerAId: string, playerBId: string) {
  return [playerAId, playerBId].sort().join('::')
}

/**
 * Monta as equipes a partir de uma lista de jogadores habilitados.
 *
 * Além de distribuir os jogadores respeitando as regras de "não pode jogar
 * junto", equilibra dois critérios entre as equipes:
 * - peso (nível/habilidade) de cada jogador;
 * - quantidade de homens e mulheres.
 *
 * No modo `balanced`, dentro de cada gênero os jogadores são distribuídos
 * sempre para a equipe com menor peso acumulado (desempate pela equipe com
 * menos membros). No modo `random`, a ordem dos jogadores é embaralhada e
 * cada um vai para a primeira equipe elegível, sem considerar peso.
 */
export class TeamDrawer {
  private readonly players: Player[]
  private readonly targetTeamSizes: number[]
  private readonly cannotPairLookup: Map<string, Set<string>>

  private readonly teams: Team[]
  private readonly teamWeights: number[]
  private readonly genderCounts: { M: number[]; F: number[] }

  constructor(
    players: Player[],
    playersPerTeam: number,
    cannotPairRules: CannotPairRule[] = [],
  ) {
    if (players.length === 0) {
      throw new Error('Nenhum jogador habilitado para sorteio')
    }
    if (playersPerTeam < 1) {
      throw new Error('Número de jogadores por time deve ser maior que 0')
    }

    this.players = players
    this.targetTeamSizes = TeamDrawer.calculateTeamSizes(
      players.length,
      playersPerTeam,
    )
    this.cannotPairLookup = TeamDrawer.buildCannotPairLookup(cannotPairRules)

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

    const femalePlayers = this.players.filter((player) => this.isFemale(player))
    const malePlayers = this.players.filter((player) => !this.isFemale(player))

    const femaleTargets = this.computeGenderTargets(femalePlayers.length)
    const maleTargets = this.targetTeamSizes.map(
      (size, i) => size - (femaleTargets[i] ?? 0),
    )

    // Distribui primeiro os homens e depois as mulheres, ambos respeitando
    // a cota de gênero calculada por equipe. O peso acumulado é compartilhado
    // entre as duas passagens, então o balanceamento por habilidade continua
    // valendo entre todos os jogadores, não só dentro de cada gênero.
    this.assignGroup(malePlayers, maleTargets, this.genderCounts.M, weighted)
    this.assignGroup(femalePlayers, femaleTargets, this.genderCounts.F, weighted)

    return this.teams
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

  private static buildCannotPairLookup(rules: CannotPairRule[]) {
    const lookup = new Map<string, Set<string>>()

    rules.forEach((rule) => {
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

  private isFemale(player: Player) {
    return player.gender === 'F'
  }

  private canJoinTeam(playerId: string, team: Team) {
    const blockedPlayers = this.cannotPairLookup.get(playerId)
    if (!blockedPlayers || blockedPlayers.size === 0) {
      return true
    }

    return !team.members.some((member) => blockedPlayers.has(member.id))
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
    let remaining = totalOfGender - targets.reduce((sum, value) => sum + value, 0)

    // Método dos maiores restos: distribui o que sobrou do arredondamento
    // para as equipes com a maior parte fracionária primeiro.
    const byFraction = rawTargets
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction)

    for (const { index } of byFraction) {
      if (remaining <= 0) break
      if (targets[index] >= (this.targetTeamSizes[index] ?? 0)) continue
      targets[index]++
      remaining--
    }

    // Segurança para casos extremos (equipes de tamanhos bem diferentes):
    // preenche onde ainda houver vaga até esgotar o restante.
    let safety = 0
    while (remaining > 0 && safety < this.targetTeamSizes.length * 2) {
      for (let i = 0; i < targets.length && remaining > 0; i++) {
        if (targets[i] < (this.targetTeamSizes[i] ?? 0)) {
          targets[i]++
          remaining--
        }
      }
      safety++
    }

    return targets
  }

  private assignGroup(
    players: Player[],
    genderTargets: number[],
    genderCounts: number[],
    weighted: boolean,
  ) {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const ordered = weighted
      ? shuffled.sort((a, b) => b.weight - a.weight)
      : shuffled

    ordered.forEach((player) => {
      const teamIndex =
        this.pickTeamForPlayer(player, genderTargets, genderCounts, weighted, true) ??
        this.pickTeamForPlayer(player, genderTargets, genderCounts, weighted, false)

      if (teamIndex === null) {
        throw new Error(
          'Não foi possível montar equipes com as restrições atuais. Revise as regras de jogadores que não podem jogar juntos.',
        )
      }

      const team = this.teams[teamIndex]
      if (!team) return

      team.members.push({ ...player })
      this.teamWeights[teamIndex] = (this.teamWeights[teamIndex] ?? 0) + player.weight
      genderCounts[teamIndex] = (genderCounts[teamIndex] ?? 0) + 1
    })
  }

  /**
   * Escolhe a equipe de destino para um jogador.
   * - `weighted`: escolhe a equipe com menor peso acumulado (desempate: menos membros).
   * - sem `weighted`: escolhe a primeira equipe elegível (ordem fixa), para o sorteio aleatório.
   * - `respectGenderQuota`: quando falso, ignora a cota de gênero (usado como fallback).
   */
  private pickTeamForPlayer(
    player: Player,
    genderTargets: number[],
    genderCounts: number[],
    weighted: boolean,
    respectGenderQuota: boolean,
  ): number | null {
    let bestIndex: number | null = null
    let bestWeight = Infinity

    for (let i = 0; i < this.teams.length; i++) {
      const team = this.teams[i]
      const maxSize = this.targetTeamSizes[i] ?? 0

      if (!team || team.members.length >= maxSize) continue
      if (respectGenderQuota && (genderCounts[i] ?? 0) >= (genderTargets[i] ?? 0)) {
        continue
      }
      if (!this.canJoinTeam(player.id, team)) continue

      if (!weighted) {
        return i
      }

      const teamWeight = this.teamWeights[i] ?? 0
      const currentBest = bestIndex === null ? null : this.teams[bestIndex]

      if (
        teamWeight < bestWeight ||
        (teamWeight === bestWeight &&
          currentBest &&
          team.members.length < currentBest.members.length)
      ) {
        bestWeight = teamWeight
        bestIndex = i
      }
    }

    return bestIndex
  }
}
