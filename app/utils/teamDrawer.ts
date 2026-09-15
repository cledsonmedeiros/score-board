import type { CannotPairRule, Player, Team } from '../stores/scoreboard'

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

    this.resetTeams()

    // Distribui primeiro os homens e depois as mulheres, ambos respeitando
    // a cota de gênero calculada por equipe. O peso acumulado é compartilhado
    // entre as duas passagens, então o balanceamento por habilidade continua
    // valendo entre todos os jogadores, não só dentro de cada gênero.
    const orderedPlayers = [
      ...this.orderPlayers(malePlayers, weighted),
      ...this.orderPlayers(femalePlayers, weighted),
    ]
    const assigned = this.assignPlayers(
      orderedPlayers,
      maleTargets,
      femaleTargets,
      weighted,
    )

    if (assigned) {
      return this.teams
    }

    throw new Error(
      'Não foi possível montar equipes com as restrições atuais. Revise as regras de jogadores que não podem jogar juntos.',
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

  private orderPlayers(players: Player[], weighted: boolean) {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    return weighted ? shuffled.sort((a, b) => b.weight - a.weight) : shuffled
  }

  private assignPlayers(
    players: Player[],
    maleTargets: number[],
    femaleTargets: number[],
    weighted: boolean,
    playerIndex = 0,
  ): boolean {
    if (playerIndex >= players.length) return true

    const player = players[playerIndex]
    if (!player) return true

    const genderTargets = this.isFemale(player) ? femaleTargets : maleTargets
    const genderCounts = this.isFemale(player)
      ? this.genderCounts.F
      : this.genderCounts.M

    const teamIndexes = this.getTeamIndexesForPlayer(
      player,
      genderTargets,
      genderCounts,
      weighted,
    )

    for (const teamIndex of teamIndexes) {
      const team = this.teams[teamIndex]
      if (!team) continue

      team.members.push({ ...player })
      this.teamWeights[teamIndex] =
        (this.teamWeights[teamIndex] ?? 0) + player.weight
      genderCounts[teamIndex] = (genderCounts[teamIndex] ?? 0) + 1

      if (
        this.assignPlayers(
          players,
          maleTargets,
          femaleTargets,
          weighted,
          playerIndex + 1,
        )
      ) {
        return true
      }

      team.members.pop()
      this.teamWeights[teamIndex] =
        (this.teamWeights[teamIndex] ?? 0) - player.weight
      genderCounts[teamIndex] = (genderCounts[teamIndex] ?? 0) - 1
    }

    return false
  }

  private getTeamIndexesForPlayer(
    player: Player,
    genderTargets: number[],
    genderCounts: number[],
    weighted: boolean,
  ): number[] {
    const indexes = this.teams
      .map((_, index) => index)
      .filter((index) => {
        const team = this.teams[index]
        const maxSize = this.targetTeamSizes[index] ?? 0
        return (
          team !== undefined &&
          team.members.length < maxSize &&
          this.canJoinTeam(player.id, team)
        )
      })

    return indexes.sort((a, b) => {
      const aWithinQuota = (genderCounts[a] ?? 0) < (genderTargets[a] ?? 0)
      const bWithinQuota = (genderCounts[b] ?? 0) < (genderTargets[b] ?? 0)

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
