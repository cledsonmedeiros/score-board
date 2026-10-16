import type { Player, Team } from '../stores/scoreboard'
import {
  createMustGroupResolver,
  findContradictoryRule,
  type PairRule,
} from './pairRules'
import { POSITIONS, type Position } from './playerProfile'

export type DrawStrategy = 'balanced' | 'random'

/**
 * Bloco indivisível de jogadores distribuído no sorteio: um jogador sozinho
 * ou um grupo de jogadores ligados por regras de "deve jogar junto".
 */
interface PlayerUnit {
  members: Player[]
  size: number
  weight: number
  femaleCount: number
  seedCount: number
  positionCounts: Record<Position, number>
  /** roleMaskCounts[máscara de posições] = jogadores do bloco com exatamente essas posições. */
  roleMaskCounts: number[]
}

/**
 * Custo de uma distribuição, em ordem de prioridade (comparado de forma
 * lexicográfica: o primeiro critério decide; os seguintes só desempatam).
 * Cada valor é a diferença entre a equipe "mais" e a "menos" favorecida.
 */
type Cost = number[]

/** Agregados por equipe, mantidos de forma incremental durante a busca local. */
interface TeamStats {
  sizes: number[]
  weights: number[]
  females: number[]
  seeds: number[]
  /** positions[índice da posição em POSITIONS][equipe] */
  positions: number[][]
  /** roleMasks[máscara de posições][equipe] */
  roleMasks: number[][]
}

type CostFunction = (stats: TeamStats) => Cost

/** Máscaras de bits das posições: bit `i` = POSITIONS[i]. */
const ROLE_MASK_COUNT = 1 << POSITIONS.length

function roleMaskOf(player: Player) {
  return POSITIONS.reduce(
    (mask, position, i) =>
      player.positions?.[position] ? mask | (1 << i) : mask,
    0,
  )
}

function popcount(value: number) {
  let count = 0
  for (let v = value; v > 0; v &= v - 1) count++
  return count
}

/**
 * Quando faltam levantadores/recepcionadores para todas as equipes, a equipe
 * com função descoberta recebe essa fração da habilidade média por função
 * faltante, em força total extra.
 */
const UNCOVERED_ROLE_COMPENSATION_RATIO = 0.5

/** Quantas reinicializações aleatórias o modo balanceado tenta antes de escolher a melhor. */
const BALANCED_RESTARTS = 30

/**
 * Diferença de força total, acima da melhor encontrada, que ainda conta como
 * "equilibrado". Dá variedade ao sorteio (ver `draw`).
 */
const SKILL_SPREAD_TOLERANCE = 1.5

/** Posição do critério de força no vetor de custo de `balancedCost`. */
const STRENGTH_COST_INDEX = 3
/** Limite de passadas completas da busca local por tentativa (proteção contra laços longos). */
const MAX_IMPROVEMENT_ROUNDS = 500

/**
 * Monta uma quantidade fixa de equipes a partir dos jogadores habilitados.
 *
 * Regras rígidas (nunca violadas; se impossível, lança erro):
 * - os tamanhos das equipes diferem em no máximo 1 jogador;
 * - "não pode jogar junto": os dois nunca ficam na mesma equipe;
 * - "deve jogar junto": o grupo (inclusive por transitividade) fica inteiro
 *   em uma única equipe.
 *
 * Critérios de equilíbrio (otimizados, em ordem de prioridade):
 * 1. cabeças de chave — espalhados entre as equipes;
 * 2. mulheres — espalhadas entre as equipes (diferença máxima de 1);
 * 3. cobertura de funções — levantador, recepção e ataque feitos por
 *    pessoas diferentes (um jogador completo cobre uma função por vez);
 * 4. habilidade — soma dos pesos (força total; a equipe menor tende a
 *    receber jogadores mais fortes para compensar, assim como a equipe que
 *    ficar com função descoberta — ver UNCOVERED_ROLE_COMPENSATION_RATIO).
 *    Diferenças até SKILL_SPREAD_TOLERANCE acima da melhor contam como
 *    empate, para o sorteio não repetir sempre as mesmas equipes;
 * 5. quantidade de cada posição por equipe;
 * 6. gênero — quantidade de homens e mulheres.
 *
 * No modo `random`, a habilidade é ignorada: a distribuição parte de uma
 * ordem aleatória e os demais critérios são equilibrados.
 *
 * A otimização é heurística (busca local com reinícios aleatórios): ela
 * busca a menor diferença possível, mas não prova que o resultado é o ótimo.
 */
export class TeamDrawer {
  private readonly numberOfTeams: number
  private readonly minTeamSize: number
  private readonly maxTeamSize: number
  private readonly units: PlayerUnit[]
  /** conflicts[a][b] = true quando algum jogador do bloco `a` não pode jogar com algum do bloco `b`. */
  private readonly conflicts: boolean[][]
  private readonly hasCannotRules: boolean
  /** Força extra que uma equipe recebe por função descoberta (metade de um jogador médio). */
  private readonly uncoveredRoleCompensation: number

  constructor(
    players: Player[],
    numberOfTeams: number,
    pairRules: PairRule[] = [],
  ) {
    if (players.length === 0) {
      throw new Error('Nenhum jogador habilitado para sorteio')
    }
    if (!Number.isInteger(numberOfTeams) || numberOfTeams < 1) {
      throw new Error(
        'A quantidade de equipes deve ser um número inteiro maior que 0',
      )
    }
    if (numberOfTeams > players.length) {
      throw new Error(
        `Não é possível formar ${numberOfTeams} equipes com ${players.length} jogadores.`,
      )
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

    this.numberOfTeams = numberOfTeams
    this.minTeamSize = Math.floor(players.length / numberOfTeams)
    this.maxTeamSize = Math.ceil(players.length / numberOfTeams)
    this.units = TeamDrawer.buildUnits(players, activeRules)
    this.conflicts = TeamDrawer.buildConflictMatrix(this.units, activeRules)
    this.hasCannotRules = activeRules.some((rule) => rule.type === 'cannot')
    const averageSkill =
      players.reduce((sum, player) => sum + player.weight, 0) / players.length
    this.uncoveredRoleCompensation =
      averageSkill * UNCOVERED_ROLE_COMPENSATION_RATIO
    this.assertUnitsFitInTeams()
  }

  /** Sorteia as equipes usando a estratégia informada. Cada chamada gera um novo sorteio. */
  draw(strategy: DrawStrategy): Team[] {
    if (strategy === 'random') {
      return this.toTeams(this.search(randomCost, 1).teamOf)
    }

    const compensation = this.uncoveredRoleCompensation

    // Fase 1: a menor diferença de força que a busca consegue alcançar.
    const strict = this.search(
      (stats) => balancedCost(stats, compensation, 0),
      BALANCED_RESTARTS,
    )
    const bestStrengthSpread = strict.cost[STRENGTH_COST_INDEX] ?? 0

    // Fase 2: qualquer diferença até `melhor + tolerância` conta como empate.
    // Sem isso, poucas divisões atingem o ótimo exato e o sorteio repete
    // sempre as mesmas equipes; dentro do empate, posições e gênero decidem.
    const allowance = bestStrengthSpread + SKILL_SPREAD_TOLERANCE
    const relaxedCost: CostFunction = (stats) =>
      balancedCost(stats, compensation, allowance)

    return this.toTeams(
      this.search(relaxedCost, BALANCED_RESTARTS, [strict.teamOf]).teamOf,
    )
  }

  /**
   * Roda `attempts` buscas locais a partir de distribuições aleatórias e
   * devolve uma das de menor custo, escolhida ao acaso entre as empatadas.
   * `seeds` entram como candidatas já prontas (ainda passam pela busca local).
   */
  private search(
    costOf: CostFunction,
    attempts: number,
    seeds: number[][] = [],
  ): { teamOf: number[]; cost: Cost } {
    let best: { teamOf: number[]; cost: Cost }[] = []

    const consider = (teamOf: number[]) => {
      const cost = this.improve(teamOf, costOf)
      const comparison = best.length ? compareCost(cost, best[0]!.cost) : -1
      if (comparison < 0) best = [{ teamOf, cost }]
      else if (comparison === 0) best.push({ teamOf, cost })
    }

    seeds.forEach((teamOf) => consider([...teamOf]))
    for (let attempt = 0; attempt < attempts; attempt++) {
      const teamOf = this.buildFeasibleAssignment()
      if (!teamOf) break // Sem solução viável: nenhuma outra tentativa vai achar.
      consider(teamOf)
    }

    const chosen = best[Math.floor(Math.random() * best.length)]
    if (!chosen) {
      throw new Error(
        'Não foi possível montar equipes com as restrições atuais. Revise as regras de "não pode jogar junto" e "deve jogar junto".',
      )
    }
    return chosen
  }

  // ---------------------------------------------------------------------------
  // Preparação
  // ---------------------------------------------------------------------------

  /** Agrupa os jogadores em blocos: cada grupo de "deve jogar junto" vira um bloco; os demais ficam sozinhos. */
  private static buildUnits(players: Player[], rules: PairRule[]) {
    const groupOf = createMustGroupResolver(rules)
    const unitsByGroup = new Map<string, PlayerUnit>()

    players.forEach((player) => {
      const groupId = groupOf(player.id)
      let unit = unitsByGroup.get(groupId)
      if (!unit) {
        unit = {
          members: [],
          size: 0,
          weight: 0,
          femaleCount: 0,
          seedCount: 0,
          positionCounts: { setter: 0, receiver: 0, attacker: 0 },
          roleMaskCounts: Array.from({ length: ROLE_MASK_COUNT }, () => 0),
        }
        unitsByGroup.set(groupId, unit)
      }

      unit.members.push(player)
      unit.size++
      unit.weight += player.weight
      if (player.gender === 'F') unit.femaleCount++
      if (player.seed) unit.seedCount++
      unit.roleMaskCounts[roleMaskOf(player)]!++
      POSITIONS.forEach((position) => {
        if (player.positions?.[position]) unit.positionCounts[position]++
      })
    })

    return [...unitsByGroup.values()]
  }

  private static buildConflictMatrix(units: PlayerUnit[], rules: PairRule[]) {
    const unitIndexByPlayer = new Map<string, number>()
    units.forEach((unit, index) => {
      unit.members.forEach((member) => unitIndexByPlayer.set(member.id, index))
    })

    const matrix = units.map(() => units.map(() => false))
    rules.forEach((rule) => {
      if (rule.type !== 'cannot') return
      const a = unitIndexByPlayer.get(rule.playerAId)
      const b = unitIndexByPlayer.get(rule.playerBId)
      if (a === undefined || b === undefined) return
      matrix[a]![b] = true
      matrix[b]![a] = true
    })
    return matrix
  }

  private assertUnitsFitInTeams() {
    const oversized = this.units.find((unit) => unit.size > this.maxTeamSize)
    if (!oversized) return

    const names = oversized.members.map((member) => member.name).join(', ')
    throw new Error(
      `O grupo que deve jogar junto (${names}) tem ${oversized.size} jogadores, mais do que o limite de ${this.maxTeamSize} por equipe.`,
    )
  }

  // ---------------------------------------------------------------------------
  // Distribuição inicial viável (backtracking)
  // ---------------------------------------------------------------------------

  /**
   * Gera uma distribuição aleatória que respeita todas as regras rígidas.
   * Retorna `teamOf[unitIndex] = teamIndex`, ou `null` se não houver solução.
   */
  private buildFeasibleAssignment(): number[] | null {
    // Blocos maiores primeiro (mais difíceis de encaixar); empates em ordem aleatória.
    const order = shuffle(this.units.map((_, index) => index)).sort(
      (a, b) => this.units[b]!.size - this.units[a]!.size,
    )
    const teamOf = this.units.map(() => -1)
    const sizes = Array.from({ length: this.numberOfTeams }, () => 0)
    // Quantas equipes podem ter o tamanho máximo (quando os tamanhos não são todos iguais).
    const largeTeamsAllowed =
      this.maxTeamSize > this.minTeamSize
        ? this.units.reduce((sum, unit) => sum + unit.size, 0) -
          this.numberOfTeams * this.minTeamSize
        : this.numberOfTeams

    const place = (position: number): boolean => {
      const unitIndex = order[position]
      if (unitIndex === undefined) return true
      const unit = this.units[unitIndex]!

      for (const team of shuffle(sizes.map((_, index) => index))) {
        const newSize = sizes[team]! + unit.size
        if (newSize > this.maxTeamSize) continue
        if (
          newSize > this.minTeamSize &&
          sizes[team]! <= this.minTeamSize &&
          sizes.filter((size) => size > this.minTeamSize).length >=
            largeTeamsAllowed
        ) {
          continue
        }
        if (this.hasConflictInTeam(unitIndex, team, teamOf, -1)) continue

        teamOf[unitIndex] = team
        sizes[team] = newSize
        if (place(position + 1)) return true
        teamOf[unitIndex] = -1
        sizes[team] = newSize - unit.size
      }
      return false
    }

    return place(0) ? teamOf : null
  }

  /** Indica se o bloco teria conflito com alguém da equipe (ignorando o bloco `except`). */
  private hasConflictInTeam(
    unitIndex: number,
    team: number,
    teamOf: number[],
    except: number,
  ) {
    if (!this.hasCannotRules) return false

    const row = this.conflicts[unitIndex]!
    return teamOf.some(
      (otherTeam, other) =>
        otherTeam === team &&
        other !== unitIndex &&
        other !== except &&
        row[other],
    )
  }

  // ---------------------------------------------------------------------------
  // Busca local
  // ---------------------------------------------------------------------------

  /**
   * Busca local: percorre os blocos aplicando a primeira movimentação que
   * reduz o custo — mover um bloco para outra equipe ou trocar dois blocos de
   * equipe — até uma passada inteira não encontrar melhoria. Só aceita
   * movimentações que mantêm as regras rígidas. Retorna o custo final.
   */
  private improve(teamOf: number[], costOf: CostFunction): Cost {
    const stats = this.computeStats(teamOf)
    let currentCost = costOf(stats)

    for (let round = 0; round < MAX_IMPROVEMENT_ROUNDS; round++) {
      let improved = false

      for (let u = 0; u < this.units.length; u++) {
        if (this.tryImproveUnit(u, teamOf, stats, costOf, currentCost)) {
          currentCost = costOf(stats)
          improved = true
        }
      }

      if (!improved) break
    }

    return currentCost
  }

  /** Tenta mover/trocar o bloco `u`; aplica e retorna `true` na primeira melhoria encontrada. */
  private tryImproveUnit(
    u: number,
    teamOf: number[],
    stats: TeamStats,
    costOf: CostFunction,
    currentCost: Cost,
  ) {
    const fromTeam = teamOf[u]!

    for (let toTeam = 0; toTeam < this.numberOfTeams; toTeam++) {
      if (toTeam === fromTeam) continue

      // `v = -1` representa mover o bloco `u` sem troca.
      for (let v = -1; v < this.units.length; v++) {
        if (v !== -1 && teamOf[v] !== toTeam) continue
        if (!this.isValidMove(teamOf, stats.sizes, u, toTeam, v)) continue

        this.applyMove(teamOf, stats, u, toTeam, v)
        if (compareCost(costOf(stats), currentCost) < 0) return true
        this.applyMove(teamOf, stats, u, fromTeam, v) // desfaz
      }
    }
    return false
  }

  private isValidMove(
    teamOf: number[],
    sizes: number[],
    u: number,
    toTeam: number,
    v: number,
  ) {
    const fromTeam = teamOf[u]!
    const sizeU = this.units[u]!.size
    const sizeV = v === -1 ? 0 : this.units[v]!.size
    const newFromSize = sizes[fromTeam]! - sizeU + sizeV
    const newToSize = sizes[toTeam]! - sizeV + sizeU

    // Com a soma fixa, manter todas as equipes entre o mínimo e o máximo
    // preserva automaticamente a quantidade de equipes de cada tamanho.
    const withinBounds = (size: number) =>
      size >= this.minTeamSize && size <= this.maxTeamSize
    if (!withinBounds(newFromSize) || !withinBounds(newToSize)) return false

    if (this.hasConflictInTeam(u, toTeam, teamOf, v)) return false
    if (v !== -1 && this.hasConflictInTeam(v, fromTeam, teamOf, u)) return false
    return true
  }

  /** Move o bloco `u` para `toTeam` e, se `v !== -1`, leva `v` para a equipe de origem de `u`. */
  private applyMove(
    teamOf: number[],
    stats: TeamStats,
    u: number,
    toTeam: number,
    v: number,
  ) {
    const fromTeam = teamOf[u]!
    this.moveUnit(teamOf, stats, u, toTeam)
    if (v !== -1) this.moveUnit(teamOf, stats, v, fromTeam)
  }

  private moveUnit(
    teamOf: number[],
    stats: TeamStats,
    unitIndex: number,
    toTeam: number,
  ) {
    const fromTeam = teamOf[unitIndex]!
    this.addUnitToStats(stats, unitIndex, fromTeam, -1)
    this.addUnitToStats(stats, unitIndex, toTeam, 1)
    teamOf[unitIndex] = toTeam
  }

  private addUnitToStats(
    stats: TeamStats,
    unitIndex: number,
    team: number,
    sign: 1 | -1,
  ) {
    const unit = this.units[unitIndex]!
    stats.sizes[team]! += sign * unit.size
    stats.weights[team]! += sign * unit.weight
    stats.females[team]! += sign * unit.femaleCount
    stats.seeds[team]! += sign * unit.seedCount
    POSITIONS.forEach((position, p) => {
      stats.positions[p]![team]! += sign * unit.positionCounts[position]
    })
    unit.roleMaskCounts.forEach((count, mask) => {
      if (count) stats.roleMasks[mask]![team]! += sign * count
    })
  }

  private computeStats(teamOf: number[]): TeamStats {
    const emptyRow = () => Array.from({ length: this.numberOfTeams }, () => 0)
    const stats: TeamStats = {
      sizes: emptyRow(),
      weights: emptyRow(),
      females: emptyRow(),
      seeds: emptyRow(),
      positions: POSITIONS.map(emptyRow),
      roleMasks: Array.from({ length: ROLE_MASK_COUNT }, emptyRow),
    }
    teamOf.forEach((team, unitIndex) =>
      this.addUnitToStats(stats, unitIndex, team, 1),
    )
    return stats
  }

  // ---------------------------------------------------------------------------
  // Custos
  // ---------------------------------------------------------------------------

  private toTeams(teamOf: number[]): Team[] {
    const teams: Team[] = Array.from(
      { length: this.numberOfTeams },
      (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }),
    )

    teamOf.forEach((team, unitIndex) => {
      teams[team]!.members.push(
        ...this.units[unitIndex]!.members.map((player) => ({
          ...player,
          positions: { ...player.positions },
        })),
      )
    })
    return teams
  }
}

/**
 * Cabeças de chave > Mulheres > Cobertura de funções > Habilidade >
 * Quantidade por posição > Gênero.
 *
 * Na habilidade, cada função descoberta "vale" `compensation` pontos a menos
 * de força: a busca então tende a dar jogadores mais fortes para essa equipe.
 */
function balancedCost(
  stats: TeamStats,
  compensation: number,
  allowedStrengthSpread: number,
): Cost {
  const effectiveStrength = stats.weights.map(
    (weight, team) => weight - compensation * teamUncoveredRoles(stats, team),
  )
  // Só o que passa da diferença permitida conta (0 = critério estrito).
  const strengthExcess = Math.max(
    0,
    spread(effectiveStrength) - allowedStrengthSpread,
  )
  return [
    spread(stats.seeds),
    spread(stats.females),
    uncoveredRoles(stats),
    roundCost(strengthExcess),
    positionSpread(stats),
    genderSpread(stats),
  ]
}

/** Evita que ruído de ponto flutuante seja tratado como melhoria. */
function roundCost(value: number) {
  return Math.round(value * 1000) / 1000
}

/** Igual ao balanceado, sem habilidade. */
function randomCost(stats: TeamStats): Cost {
  return [
    spread(stats.seeds),
    spread(stats.females),
    uncoveredRoles(stats),
    positionSpread(stats),
    genderSpread(stats),
  ]
}

/**
 * Soma, em todas as equipes, das funções que ficam sem uma pessoa dedicada.
 *
 * É um emparelhamento máximo entre funções e jogadores (cada jogador assume
 * no máximo uma função). Pelo teorema de Hall, as funções descobertas são
 * `max(|S| - |N(S)|)` sobre os subconjuntos `S` de funções, onde `N(S)` são
 * os jogadores que sabem fazer alguma função de `S`. Com 3 posições são só 7
 * subconjuntos, então a conta é direta.
 */
function uncoveredRoles(stats: TeamStats) {
  let total = 0
  for (let team = 0; team < stats.sizes.length; team++) {
    total += teamUncoveredRoles(stats, team)
  }
  return total
}

function teamUncoveredRoles(stats: TeamStats, team: number) {
  let worstDeficit = 0
  for (let subset = 1; subset < ROLE_MASK_COUNT; subset++) {
    let neighbours = 0
    for (let mask = 1; mask < ROLE_MASK_COUNT; mask++) {
      if (mask & subset) neighbours += stats.roleMasks[mask]![team]!
    }
    worstDeficit = Math.max(worstDeficit, popcount(subset) - neighbours)
  }
  return worstDeficit
}

function positionSpread(stats: TeamStats) {
  return stats.positions.reduce((sum, row) => sum + spread(row), 0)
}

function genderSpread(stats: TeamStats) {
  const males = stats.sizes.map((size, team) => size - stats.females[team]!)
  return spread(stats.females) + spread(males)
}

function spread(values: number[]) {
  return Math.max(...values) - Math.min(...values)
}

function compareCost(a: Cost, b: Cost) {
  for (let i = 0; i < a.length; i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/** Fisher–Yates: embaralhamento uniforme (o `sort(() => Math.random() - 0.5)` anterior é enviesado). */
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}
