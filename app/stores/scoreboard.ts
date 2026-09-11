import { defineStore } from 'pinia'
import { TeamDrawer, getPairKey } from '~/utils/teamDrawer'

export type Gender = 'M' | 'F'

export interface Player {
  id: string
  name: string
  weight: number
  gender: Gender
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
  enabled?: boolean
}

export interface CannotPairRuleImportData {
  playerAName: string
  playerBName: string
}

export interface TransferPayloadV3 {
  version: 3
  players: PlayerImportData[]
  cannotPairRules: CannotPairRuleImportData[]
}

export interface DecodedTransferPayload {
  players: PlayerImportData[]
  cannotPairRules: CannotPairRuleImportData[]
}

export interface CannotPairRule {
  id: string
  playerAId: string
  playerBId: string
}

export type TeamColor = 'red' | 'blue'

export interface Teams {
  red: Team
  blue: Team
}

const STORAGE_KEY = 'scoreboard-players'
const TEAMS_STORAGE_KEY = 'scoreboard-teams'
const CONSTRAINTS_STORAGE_KEY = 'scoreboard-constraints'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    players: [] as Player[],
    teams: {
      red: { name: 'EQUIPE 1', score: 0, members: [] },
      blue: { name: 'EQUIPE 2', score: 0, members: [] },
    } as Teams,
    allTeams: [] as Team[], // Para sortear múltiplas equipes
    cannotPairRules: [] as CannotPairRule[],
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
        enabled: player.enabled,
      }))

      const cannotPairRulesPayload = this.cannotPairRules
        .map((rule) => {
          const playerA = this.players.find((player) => player.id === rule.playerAId)
          const playerB = this.players.find((player) => player.id === rule.playerBId)

          if (!playerA || !playerB) {
            return null
          }

          return {
            playerAName: playerA.name,
            playerBName: playerB.name,
          }
        })
        .filter((rule): rule is CannotPairRuleImportData => !!rule)

      const payload: TransferPayloadV3 = {
        version: 3,
        players: playersPayload,
        cannotPairRules: cannotPairRulesPayload,
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

      if (Array.isArray(parsed)) {
        return {
          players: parsed as PlayerImportData[],
          cannotPairRules: [] as CannotPairRuleImportData[],
        }
      }

      if (parsed && typeof parsed === 'object') {
        const payload = parsed as {
          players?: unknown
          cannotPairRules?: unknown
        }

        if (!Array.isArray(payload.players)) {
          throw new Error('Formato inválido: esperado dados de jogadores')
        }

        const cannotPairRules = Array.isArray(payload.cannotPairRules)
          ? payload.cannotPairRules.filter(
              (rule): rule is CannotPairRuleImportData =>
                typeof rule?.playerAName === 'string' &&
                typeof rule?.playerBName === 'string',
            )
          : []

        return {
          players: payload.players as PlayerImportData[],
          cannotPairRules,
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
        const rawName = typeof player.name === 'string' ? player.name.trim() : ''

        if (!rawName) {
          skippedCount++
          return
        }

        const normalizedName = this.normalizePlayerName(rawName)
        if (existingNames.has(normalizedName)) {
          skippedCount++
          return
        }

        const weight =
          typeof player.weight === 'number'
            ? Math.max(1, Math.min(5, player.weight))
            : 3

        const gender = this.normalizeGender(player.gender)

        const enabled =
          typeof player.enabled === 'boolean'
            ? player.enabled
            : true

        const timestamp = Date.now()
        this.players.push({
          id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          name: rawName,
          weight,
          gender,
          enabled,
          createdAt: timestamp,
        })

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
        const rawName = typeof player.name === 'string' ? player.name.trim() : ''

        if (!rawName) {
          skippedCount++
          return
        }

        const normalizedName = this.normalizePlayerName(rawName)
        if (seenNames.has(normalizedName)) {
          skippedCount++
          return
        }

        const weight =
          typeof player.weight === 'number'
            ? Math.max(1, Math.min(5, player.weight))
            : 3

        const gender = this.normalizeGender(player.gender)

        const enabled =
          typeof player.enabled === 'boolean'
            ? player.enabled
            : true

        const timestamp = Date.now()
        nextPlayers.push({
          id: `${timestamp}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          name: rawName,
          weight,
          gender,
          enabled,
          createdAt: timestamp,
        })

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

    importCannotPairRules(
      importedRules: CannotPairRuleImportData[],
      replaceExisting: boolean,
    ) {
      if (replaceExisting) {
        this.cannotPairRules = []
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

        const addedRule = this.addCannotPairRule(playerAId, playerBId)
        if (addedRule) {
          ruleAddedCount++
        } else {
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

      const ruleResult = this.importCannotPairRules(
        decoded.cannotPairRules,
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
            // Normaliza jogadores salvos antes do campo `gender` existir
            this.players = Array.isArray(parsed)
              ? parsed.map((player: Player) => ({
                  ...player,
                  gender: this.normalizeGender(player.gender),
                }))
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
              this.cannotPairRules = parsed.filter(
                (rule): rule is CannotPairRule =>
                  typeof rule?.id === 'string' &&
                  typeof rule?.playerAId === 'string' &&
                  typeof rule?.playerBId === 'string' &&
                  rule.playerAId !== rule.playerBId,
              )
            } else {
              this.cannotPairRules = []
            }
          } catch (e) {
            console.error('Erro ao carregar restrições:', e)
            this.cannotPairRules = []
          }
        }
      }
    },

    saveConstraints() {
      if (import.meta.client) {
        localStorage.setItem(
          CONSTRAINTS_STORAGE_KEY,
          JSON.stringify(this.cannotPairRules),
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
              this.allTeams = data
              if (data[0]) this.teams.red = data[0]
              if (data[1]) this.teams.blue = data[1]
            } else {
              this.teams = data
            }
          } catch (e) {
            console.error('Erro ao carregar equipes:', e)
          }
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
        localStorage.setItem('scoreboard-all-teams', JSON.stringify(this.allTeams))
      }
    },

    // Players
    addPlayer(name: string, weight: number = 3, gender: Gender = 'M') {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        weight: Math.max(1, Math.min(5, weight)),
        gender,
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

        const previousLength = this.cannotPairRules.length
        this.cannotPairRules = this.cannotPairRules.filter(
          (rule) => rule.playerAId !== playerId && rule.playerBId !== playerId,
        )
        if (this.cannotPairRules.length !== previousLength) {
          this.saveConstraints()
        }

        return true
      }
      return false
    },

    addCannotPairRule(playerAId: string, playerBId: string) {
      if (playerAId === playerBId) {
        throw new Error('Selecione dois jogadores diferentes para a restrição')
      }

      const playerAExists = this.players.some((player) => player.id === playerAId)
      const playerBExists = this.players.some((player) => player.id === playerBId)

      if (!playerAExists || !playerBExists) {
        throw new Error('Jogador não encontrado para criar restrição')
      }

      const pairKey = getPairKey(playerAId, playerBId)
      const alreadyExists = this.cannotPairRules.some(
        (rule) => getPairKey(rule.playerAId, rule.playerBId) === pairKey,
      )

      if (alreadyExists) {
        return null
      }

      const rule: CannotPairRule = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerAId,
        playerBId,
      }

      this.cannotPairRules.push(rule)
      this.saveConstraints()
      return rule
    },

    removeCannotPairRule(ruleId: string) {
      const index = this.cannotPairRules.findIndex((rule) => rule.id === ruleId)
      if (index !== -1) {
        this.cannotPairRules.splice(index, 1)
        this.saveConstraints()
        return true
      }

      return false
    },

    clearCannotPairRules() {
      this.cannotPairRules = []
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
          player.weight = Math.max(1, Math.min(5, updates.weight))
        }
        if (updates.gender !== undefined) {
          player.gender = updates.gender
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
    drawTeams(playersPerTeam: number) {
      const drawer = new TeamDrawer(
        this.enabledPlayers,
        playersPerTeam,
        this.cannotPairRules,
      )
      this.allTeams = drawer.draw('balanced')

      // Atualizar times red e blue com os primeiros da lista
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
      return this.allTeams
    },

    drawRandomTeams(playersPerTeam: number) {
      const drawer = new TeamDrawer(
        this.enabledPlayers,
        playersPerTeam,
        this.cannotPairRules,
      )
      this.allTeams = drawer.draw('random')

      // Atualizar times red e blue com os primeiros da lista
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
      return this.allTeams
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

      // Limpa o localStorage
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TEAMS_STORAGE_KEY)
        localStorage.removeItem('scoreboard-all-teams')
        localStorage.removeItem(CONSTRAINTS_STORAGE_KEY)
      }
    },

    // Initialize
    init() {
      this.loadPlayers()
      this.loadTeams()
      this.loadConstraints()
    },
  },
})
