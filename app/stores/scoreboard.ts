import { defineStore } from 'pinia'
import { TeamDrawer, type DrawStrategy } from '~/utils/teamDrawer'
import {
  SKILL_DEFAULT,
  migrateLegacySkill,
  normalizePositions,
  normalizeSkill,
  type PlayerPositions,
} from '~/utils/playerProfile'
import {
  PLAYER_STORAGE_KEYS,
  migrateLegacyStorage,
} from '~/utils/storageMigration'
import {
  PAIR_RULE_LABELS,
  findContradictoryRule,
  getPairKey,
  normalizePairRuleType,
  type PairRule,
  type PairRuleType,
} from '~/utils/pairRules'

export type Gender = 'M' | 'F'

export interface Player {
  id: string
  name: string
  /** Habilidade na escala 1–10, em passos de 0.5. */
  weight: number
  gender: Gender
  positions: PlayerPositions
  /** Cabeça de chave: o sorteio espalha esses jogadores entre as equipes. */
  seed: boolean
  enabled: boolean
  createdAt: number
}

export interface Team {
  name: string
  score: number
  members: Player[]
}

export interface PlayerImportData {
  name: string
  weight?: number
  gender?: Gender
  positions?: Partial<PlayerPositions>
  seed?: boolean
  enabled?: boolean
}

export interface PairRuleImportData {
  type: PairRuleType
  playerAName: string
  playerBName: string
}

/**
 * Formato de transferência atual.
 * - v5: habilidade na escala 1–10 e posições. Até a v4 a escala era 1–5, e
 *   esses dados são convertidos na importação.
 * - As regras ficam em `pairRules` (e não em `cannotPairRules`, usado até a
 *   v3) de propósito: versões antigas do app ignoram o campo novo em vez de
 *   importar uma regra "deve jogar junto" como se fosse "não pode jogar junto".
 */
export interface TransferPayloadV5 {
  version: 5
  players: PlayerImportData[]
  pairRules: PairRuleImportData[]
}

const TRANSFER_VERSION_WITH_SKILL_10 = 5

export interface DecodedTransferPayload {
  players: PlayerImportData[]
  pairRules: PairRuleImportData[]
}

export type TeamColor = 'red' | 'blue'

export interface Teams {
  red: Team
  blue: Team
}

const STORAGE_KEY = PLAYER_STORAGE_KEYS.players
const TEAMS_STORAGE_KEY = PLAYER_STORAGE_KEYS.teams
const ALL_TEAMS_STORAGE_KEY = PLAYER_STORAGE_KEYS.allTeams
const CONSTRAINTS_STORAGE_KEY = 'scoreboard-constraints'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    players: [] as Player[],
    teams: {
      red: { name: 'EQUIPE 1', score: 0, members: [] },
      blue: { name: 'EQUIPE 2', score: 0, members: [] },
    } as Teams,
    allTeams: [] as Team[], // Para sortear múltiplas equipes
    pairRules: [] as PairRule[],
  }),

  getters: {
    enabledPlayers: (state) => state.players.filter((p) => p.enabled),
    redTeam: (state) => state.teams.red,
    blueTeam: (state) => state.teams.blue,
    availableTeams: (state) => state.allTeams.filter((t) => t.members.length > 0),
  },

  actions: {
    normalizePlayerName(name: string) {
      return name.trim().toLocaleLowerCase('pt-BR')
    },

    normalizeGender(gender: unknown): Gender {
      return gender === 'F' ? 'F' : 'M'
    },

    /** Garante que um jogador salvo/importado tenha todos os campos válidos. */
    normalizeStoredPlayer(player: Player): Player {
      return {
        ...player,
        weight: normalizeSkill(player.weight),
        gender: this.normalizeGender(player.gender),
        positions: normalizePositions(player.positions),
        seed: player.seed === true,
      }
    },

    normalizeStoredTeam(team: Team): Team {
      return {
        ...team,
        members: Array.isArray(team?.members)
          ? team.members.map((member) => this.normalizeStoredPlayer(member))
          : [],
      }
    },

    /** Cria um jogador a partir de dados importados; retorna `null` se não houver nome. */
    buildImportedPlayer(player: PlayerImportData, id: string): Player | null {
      const name = typeof player.name === 'string' ? player.name.trim() : ''
      if (!name) return null

      return {
        id,
        name,
        weight: normalizeSkill(player.weight ?? SKILL_DEFAULT),
        gender: this.normalizeGender(player.gender),
        positions: normalizePositions(player.positions),
        seed: player.seed === true,
        enabled: typeof player.enabled === 'boolean' ? player.enabled : true,
        createdAt: Date.now(),
      }
    },

    resolvePlayerIdByName(name: string) {
      const normalizedName = this.normalizePlayerName(name)
      const player = this.players.find(
        (item) => this.normalizePlayerName(item.name) === normalizedName,
      )
      return player?.id ?? null
    },

    exportPlayersBase64() {
      const playersPayload = this.players.map((player) => ({
        name: player.name,
        weight: player.weight,
        gender: player.gender,
        positions: { ...player.positions },
        seed: player.seed,
        enabled: player.enabled,
      }))

      const pairRulesPayload = this.pairRules
        .map((rule): PairRuleImportData | null => {
          const playerA = this.players.find((player) => player.id === rule.playerAId)
          const playerB = this.players.find((player) => player.id === rule.playerBId)

          if (!playerA || !playerB) {
            return null
          }

          return {
            type: rule.type,
            playerAName: playerA.name,
            playerBName: playerB.name,
          }
        })
        .filter((rule): rule is PairRuleImportData => !!rule)

      const payload: TransferPayloadV5 = {
        version: 5,
        players: playersPayload,
        pairRules: pairRulesPayload,
      }

      const json = JSON.stringify(payload)
      const bytes = new TextEncoder().encode(json)
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
      return btoa(binary)
    },

    decodePlayersBase64(base64: string): DecodedTransferPayload {
      const normalizedBase64 = base64.trim()
      const binary = atob(normalizedBase64)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      const json = new TextDecoder().decode(bytes)
      const parsed: unknown = JSON.parse(json)

      // Até a v4 (e no formato de lista, sem versão) a habilidade ia de 1 a 5.
      const toCurrentScale = (players: PlayerImportData[]) =>
        players.map((player) => ({
          ...player,
          weight:
            typeof player?.weight === 'number'
              ? migrateLegacySkill(player.weight)
              : undefined,
        }))

      if (Array.isArray(parsed)) {
        return {
          players: toCurrentScale(parsed as PlayerImportData[]),
          pairRules: [],
        }
      }

      if (parsed && typeof parsed === 'object') {
        const payload = parsed as {
          version?: unknown
          players?: unknown
          pairRules?: unknown
          cannotPairRules?: unknown
        }

        if (!Array.isArray(payload.players)) {
          throw new Error('Formato inválido: esperado dados de jogadores')
        }

        // v4 usa `pairRules` com tipo; v3 usava `cannotPairRules` (sempre "não pode").
        const rawRules = Array.isArray(payload.pairRules)
          ? payload.pairRules
          : Array.isArray(payload.cannotPairRules)
            ? payload.cannotPairRules
            : []

        const pairRules = rawRules
          .filter(
            (rule) =>
              typeof rule?.playerAName === 'string' &&
              typeof rule?.playerBName === 'string',
          )
          .map(
            (rule): PairRuleImportData => ({
              type: normalizePairRuleType(rule.type),
              playerAName: rule.playerAName,
              playerBName: rule.playerBName,
            }),
          )

        const isCurrentScale =
          typeof payload.version === 'number' &&
          payload.version >= TRANSFER_VERSION_WITH_SKILL_10
        const players = payload.players as PlayerImportData[]

        return {
          players: isCurrentScale ? players : toCurrentScale(players),
          pairRules,
        }
      }

      throw new Error('Formato inválido: esperado dados de jogadores')
    },

    importPlayersMerge(importedPlayers: PlayerImportData[]) {
      const existingNames = new Set(
        this.players.map((player) => this.normalizePlayerName(player.name)),
      )

      let addedCount = 0
      let skippedCount = 0

      importedPlayers.forEach((player) => {
        const newPlayer = this.buildImportedPlayer(
          player,
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        )
        const normalizedName = newPlayer
          ? this.normalizePlayerName(newPlayer.name)
          : ''

        if (!newPlayer || existingNames.has(normalizedName)) {
          skippedCount++
          return
        }

        this.players.push(newPlayer)
        existingNames.add(normalizedName)
        addedCount++
      })

      if (addedCount > 0) {
        this.savePlayers()
      }

      return {
        addedCount,
        skippedCount,
        total: importedPlayers.length,
      }
    },

    replacePlayersFromImport(importedPlayers: PlayerImportData[]) {
      const seenNames = new Set<string>()
      const nextPlayers: Player[] = []
      let addedCount = 0
      let skippedCount = 0

      importedPlayers.forEach((player, index) => {
        const newPlayer = this.buildImportedPlayer(
          player,
          `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        )
        const normalizedName = newPlayer
          ? this.normalizePlayerName(newPlayer.name)
          : ''

        if (!newPlayer || seenNames.has(normalizedName)) {
          skippedCount++
          return
        }

        nextPlayers.push(newPlayer)
        seenNames.add(normalizedName)
        addedCount++
      })

      this.players = nextPlayers
      this.teams = {
        red: { name: 'EQUIPE 1', score: 0, members: [] },
        blue: { name: 'EQUIPE 2', score: 0, members: [] },
      }
      this.allTeams = []

      this.savePlayers()
      this.saveTeams()
      this.saveAllTeams()

      return {
        addedCount,
        skippedCount,
        total: importedPlayers.length,
      }
    },

    importPairRules(
      importedRules: PairRuleImportData[],
      replaceExisting: boolean,
    ) {
      if (replaceExisting) {
        this.pairRules = []
      }

      let ruleAddedCount = 0
      let ruleSkippedCount = 0

      importedRules.forEach((rule) => {
        const playerAId = this.resolvePlayerIdByName(rule.playerAName)
        const playerBId = this.resolvePlayerIdByName(rule.playerBName)

        if (!playerAId || !playerBId || playerAId === playerBId) {
          ruleSkippedCount++
          return
        }

        try {
          const addedRule = this.addPairRule(playerAId, playerBId, rule.type)
          if (addedRule) {
            ruleAddedCount++
          } else {
            ruleSkippedCount++
          }
        } catch {
          // Regra conflitante com as já existentes: ignora em vez de abortar a importação.
          ruleSkippedCount++
        }
      })

      this.saveConstraints()

      return {
        ruleAddedCount,
        ruleSkippedCount,
        ruleTotal: importedRules.length,
      }
    },

    importPlayersFromBase64(base64: string, replaceLocalData: boolean = false) {
      const decoded = this.decodePlayersBase64(base64)
      const playerResult = replaceLocalData
        ? this.replacePlayersFromImport(decoded.players)
        : this.importPlayersMerge(decoded.players)

      const ruleResult = this.importPairRules(
        decoded.pairRules,
        replaceLocalData,
      )

      return {
        ...playerResult,
        ...ruleResult,
      }
    },

    // Storage
    loadPlayers() {
      if (import.meta.client) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            // Completa campos que não existiam em versões antigas (gênero, posições).
            this.players = Array.isArray(parsed)
              ? parsed.map((player: Player) =>
                  this.normalizeStoredPlayer(player),
                )
              : []
          } catch (e) {
            console.error('Erro ao carregar jogadores:', e)
            this.players = []
          }
        }
      }
    },

    savePlayers() {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.players))
      }
    },

    loadConstraints() {
      if (import.meta.client) {
        const stored = localStorage.getItem(CONSTRAINTS_STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)

            if (Array.isArray(parsed)) {
              // Regras salvas antes do campo `type` existir são "não pode jogar junto".
              this.pairRules = parsed
                .filter(
                  (rule) =>
                    typeof rule?.id === 'string' &&
                    typeof rule?.playerAId === 'string' &&
                    typeof rule?.playerBId === 'string' &&
                    rule.playerAId !== rule.playerBId,
                )
                .map(
                  (rule): PairRule => ({
                    id: rule.id,
                    type: normalizePairRuleType(rule.type),
                    playerAId: rule.playerAId,
                    playerBId: rule.playerBId,
                  }),
                )
            } else {
              this.pairRules = []
            }
          } catch (e) {
            console.error('Erro ao carregar restrições:', e)
            this.pairRules = []
          }
        }
      }
    },

    saveConstraints() {
      if (import.meta.client) {
        localStorage.setItem(
          CONSTRAINTS_STORAGE_KEY,
          JSON.stringify(this.pairRules),
        )
      }
    },

    loadTeams() {
      if (import.meta.client) {
        const stored = localStorage.getItem(TEAMS_STORAGE_KEY)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            // Suporta formato antigo (array) e novo (object)
            if (Array.isArray(data)) {
              this.allTeams = data.map((team: Team) =>
                this.normalizeStoredTeam(team),
              )
              if (this.allTeams[0]) this.teams.red = this.allTeams[0]
              if (this.allTeams[1]) this.teams.blue = this.allTeams[1]
            } else {
              if (data?.red) this.teams.red = this.normalizeStoredTeam(data.red)
              if (data?.blue) {
                this.teams.blue = this.normalizeStoredTeam(data.blue)
              }
            }
          } catch (e) {
            console.error('Erro ao carregar equipes:', e)
          }
        }
      }
    },

    /**
     * Recarrega todas as equipes do último sorteio (salvas por `saveAllTeams`).
     * Sem isso, depois de recarregar a página o placar ficava só com as duas
     * equipes em jogo e as ações de ver/escolher/sortear equipes sumiam.
     */
    loadAllTeams() {
      if (import.meta.client) {
        const stored = localStorage.getItem(ALL_TEAMS_STORAGE_KEY)
        if (!stored) return
        try {
          const data = JSON.parse(stored)
          if (Array.isArray(data)) {
            this.allTeams = data.map((team: Team) =>
              this.normalizeStoredTeam(team),
            )
          }
        } catch (e) {
          console.error('Erro ao carregar o sorteio de equipes:', e)
        }
      }
    },

    saveTeams() {
      if (import.meta.client) {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(this.teams))
      }
    },

    saveAllTeams() {
      if (import.meta.client) {
        localStorage.setItem(ALL_TEAMS_STORAGE_KEY, JSON.stringify(this.allTeams))
      }
    },

    // Players
    addPlayer(
      name: string,
      weight: number = SKILL_DEFAULT,
      gender: Gender = 'M',
      positions?: Partial<PlayerPositions>,
    ) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        weight: normalizeSkill(weight),
        gender,
        positions: normalizePositions(positions),
        seed: false,
        enabled: true,
        createdAt: Date.now(),
      }

      this.players.push(newPlayer)
      this.savePlayers()
      return newPlayer
    },

    removePlayer(playerId: string) {
      const index = this.players.findIndex((p) => p.id === playerId)
      if (index !== -1) {
        this.players.splice(index, 1)
        this.savePlayers()

        const previousLength = this.pairRules.length
        this.pairRules = this.pairRules.filter(
          (rule) => rule.playerAId !== playerId && rule.playerBId !== playerId,
        )
        if (this.pairRules.length !== previousLength) {
          this.saveConstraints()
        }

        return true
      }
      return false
    },

    /**
     * Cria uma regra entre dois jogadores. Retorna `null` se a mesma regra já
     * existir (idempotente) e lança erro se ela contradizer as regras atuais.
     */
    addPairRule(playerAId: string, playerBId: string, type: PairRuleType) {
      if (playerAId === playerBId) {
        throw new Error('Selecione dois jogadores diferentes para a regra')
      }

      const playerA = this.players.find((player) => player.id === playerAId)
      const playerB = this.players.find((player) => player.id === playerBId)

      if (!playerA || !playerB) {
        throw new Error('Jogador não encontrado para criar a regra')
      }

      const pairKey = getPairKey(playerAId, playerBId)
      const existingRule = this.pairRules.find(
        (rule) => getPairKey(rule.playerAId, rule.playerBId) === pairKey,
      )

      if (existingRule) {
        if (existingRule.type === type) {
          return null
        }
        throw new Error(
          `Já existe a regra "${playerA.name} ${PAIR_RULE_LABELS[existingRule.type]} ${playerB.name}". Remova-a antes de criar a regra oposta.`,
        )
      }

      const rule: PairRule = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        playerAId,
        playerBId,
      }

      const conflict = findContradictoryRule([...this.pairRules, rule])
      if (conflict) {
        const nameOf = (id: string) =>
          this.players.find((player) => player.id === id)?.name ?? 'Jogador removido'
        throw new Error(
          `Essa regra gera um conflito: ${nameOf(conflict.playerAId)} e ${nameOf(conflict.playerBId)} não podem jogar juntos, mas ficariam no mesmo grupo de "deve jogar com".`,
        )
      }

      this.pairRules.push(rule)
      this.saveConstraints()
      return rule
    },

    removePairRule(ruleId: string) {
      const index = this.pairRules.findIndex((rule) => rule.id === ruleId)
      if (index !== -1) {
        this.pairRules.splice(index, 1)
        this.saveConstraints()
        return true
      }

      return false
    },

    clearPairRules() {
      this.pairRules = []
      this.saveConstraints()
    },

    updatePlayer(
      playerId: string,
      updates: Partial<Omit<Player, 'id' | 'createdAt'>>,
    ) {
      const player = this.players.find((p) => p.id === playerId)
      if (player) {
        if (updates.name !== undefined) {
          player.name = updates.name.trim()
        }
        if (updates.weight !== undefined) {
          player.weight = normalizeSkill(updates.weight)
        }
        if (updates.gender !== undefined) {
          player.gender = updates.gender
        }
        if (updates.seed !== undefined) {
          player.seed = updates.seed
        }
        if (updates.positions !== undefined) {
          player.positions = normalizePositions(updates.positions)
        }
        if (updates.enabled !== undefined) {
          player.enabled = updates.enabled
        }
        this.savePlayers()
        return player
      }
      return null
    },

    togglePlayerEnabled(playerId: string) {
      const player = this.players.find((p) => p.id === playerId)
      if (player) {
        player.enabled = !player.enabled
        this.savePlayers()
        return player.enabled
      }
      return false
    },

    // Teams
    /**
     * Sorteia `numberOfTeams` equipes. Com `playersPerTeam`, cada equipe tem
     * exatamente esse tamanho e quem sobra volta em `bench` (fica de fora).
     */
    drawTeams(
      numberOfTeams: number,
      strategy: DrawStrategy = 'balanced',
      playersPerTeam?: number,
    ) {
      const drawer = new TeamDrawer(
        this.enabledPlayers,
        numberOfTeams,
        this.pairRules,
        playersPerTeam,
      )
      const { teams, bench } = drawer.draw(strategy)
      this.allTeams = teams

      // Atualizar times red e blue com os primeiros da lista
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
      return { teams: this.allTeams, bench }
    },

    saveManualTeams(teams: Team[]) {
      // Reseta scores das equipes manuais
      const teamsWithScores = teams.map((team) => ({
        ...team,
        score: 0,
      }))

      this.allTeams = teamsWithScores

      // Atualizar times red e blue com os primeiros da lista
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
    },

    /** Troca dois jogadores de equipe (precisam estar em equipes diferentes dentro de `allTeams`). */
    swapPlayers(playerAId: string, playerBId: string) {
      if (playerAId === playerBId) {
        return false
      }

      let teamAIndex = -1
      let memberAIndex = -1
      let teamBIndex = -1
      let memberBIndex = -1

      this.allTeams.forEach((team, teamIndex) => {
        const indexInTeam = team.members.findIndex((member) => member.id === playerAId)
        if (indexInTeam !== -1) {
          teamAIndex = teamIndex
          memberAIndex = indexInTeam
        }

        const otherIndexInTeam = team.members.findIndex((member) => member.id === playerBId)
        if (otherIndexInTeam !== -1) {
          teamBIndex = teamIndex
          memberBIndex = otherIndexInTeam
        }
      })

      if (teamAIndex === -1 || teamBIndex === -1 || teamAIndex === teamBIndex) {
        return false
      }

      const teamA = this.allTeams[teamAIndex]
      const teamB = this.allTeams[teamBIndex]
      const playerA = teamA?.members[memberAIndex]
      const playerB = teamB?.members[memberBIndex]

      if (!teamA || !teamB || !playerA || !playerB) {
        return false
      }

      teamA.members.splice(memberAIndex, 1, playerB)
      teamB.members.splice(memberBIndex, 1, playerA)

      // Atualizar times red e blue caso alguma das equipes afetadas seja uma delas
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
      return true
    },

    incrementTeamScore(color: TeamColor) {
      this.teams[color].score++
      this.saveTeams()
    },

    decrementTeamScore(color: TeamColor) {
      if (this.teams[color].score > 0) {
        this.teams[color].score--
        this.saveTeams()
      }
    },

    setSelectedTeam(color: TeamColor, team: Team) {
      this.teams[color] = { ...team }
      this.saveTeams()
    },

    swapSelectedTeams() {
      const temp = { ...this.teams.red }
      this.teams.red = { ...this.teams.blue }
      this.teams.blue = temp
      this.saveTeams()
    },

    resetScores() {
      this.teams.red.score = 0
      this.teams.blue.score = 0
      this.saveTeams()
    },

    clearAllData() {
      // Reseta o estado
      this.players = []
      this.teams = {
        red: { name: 'EQUIPE 1', score: 0, members: [] },
        blue: { name: 'EQUIPE 2', score: 0, members: [] },
      }
      this.allTeams = []
      this.pairRules = []

      // Limpa o localStorage
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TEAMS_STORAGE_KEY)
        localStorage.removeItem(ALL_TEAMS_STORAGE_KEY)
        localStorage.removeItem(CONSTRAINTS_STORAGE_KEY)
      }
    },

    // Initialize
    init() {
      if (import.meta.client) {
        migrateLegacyStorage(localStorage)
      }
      this.loadPlayers()
      this.loadTeams()
      this.loadAllTeams()
      this.loadConstraints()
    },
  },
})
