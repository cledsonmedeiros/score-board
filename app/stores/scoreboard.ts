import { defineStore } from 'pinia'

export interface Player {
  id: string
  name: string
  weight: number
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
  enabled?: boolean
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
    getPairKey(playerAId: string, playerBId: string) {
      return [playerAId, playerBId].sort().join('::')
    },

    buildCannotPairLookup() {
      const lookup = new Map<string, Set<string>>()

      this.cannotPairRules.forEach((rule) => {
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
    },

    canJoinTeam(playerId: string, team: Team, cannotPairLookup: Map<string, Set<string>>) {
      const blockedPlayers = cannotPairLookup.get(playerId)
      if (!blockedPlayers || blockedPlayers.size === 0) {
        return true
      }

      return !team.members.some((member) => blockedPlayers.has(member.id))
    },

    normalizePlayerName(name: string) {
      return name.trim().toLocaleLowerCase('pt-BR')
    },

    exportPlayersBase64() {
      const payload = this.players.map((player) => ({
        name: player.name,
        weight: player.weight,
        enabled: player.enabled,
      }))

      const json = JSON.stringify(payload)
      const bytes = new TextEncoder().encode(json)
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
      return btoa(binary)
    },

    decodePlayersBase64(base64: string) {
      const normalizedBase64 = base64.trim()
      const binary = atob(normalizedBase64)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      const json = new TextDecoder().decode(bytes)
      const parsed = JSON.parse(json)

      if (!Array.isArray(parsed)) {
        throw new Error('Formato inválido: esperado uma lista de jogadores')
      }

      return parsed as PlayerImportData[]
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

        const enabled =
          typeof player.enabled === 'boolean'
            ? player.enabled
            : true

        const timestamp = Date.now()
        this.players.push({
          id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          name: rawName,
          weight,
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

    importPlayersFromBase64(base64: string) {
      const decoded = this.decodePlayersBase64(base64)
      return this.importPlayersMerge(decoded)
    },

    // Storage
    loadPlayers() {
      if (import.meta.client) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            this.players = JSON.parse(stored)
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
    addPlayer(name: string, weight: number = 3) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        weight: Math.max(1, Math.min(5, weight)),
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

      const pairKey = this.getPairKey(playerAId, playerBId)
      const alreadyExists = this.cannotPairRules.some(
        (rule) => this.getPairKey(rule.playerAId, rule.playerBId) === pairKey,
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
      const available = this.enabledPlayers
      if (available.length === 0) {
        throw new Error('Nenhum jogador habilitado para sorteio')
      }

      if (playersPerTeam < 1) {
        throw new Error('Número de jogadores por time deve ser maior que 0')
      }

      // Calcular número de times
      let numberOfTeams = Math.ceil(available.length / playersPerTeam)

      const completeTeams = Math.floor(available.length / playersPerTeam)
      const remainder = available.length % playersPerTeam
      const targetTeamSizes = [
        ...Array.from({ length: completeTeams }, () => playersPerTeam),
        ...(remainder > 0 ? [remainder] : []),
      ]

      this.allTeams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      const teamWeights = Array.from({ length: numberOfTeams }, () => 0)
      const cannotPairLookup = this.buildCannotPairLookup()

      // Embaralhar jogadores primeiro
      const shuffledPlayers = [...available].sort(() => Math.random() - 0.5)
      // Ordenar por peso (maior para menor) para balancear
      const sortedPlayers = shuffledPlayers.sort((a, b) => b.weight - a.weight)

      // Distribuir jogadores de forma balanceada pelo peso
      sortedPlayers.forEach((player) => {
        let targetTeamIndex = -1
        let minWeight = Infinity

        for (let i = 0; i < numberOfTeams; i++) {
          const team = this.allTeams[i]
          const maxSize = targetTeamSizes[i] ?? 0

          if (!team || team.members.length >= maxSize) {
            continue
          }

          if (!this.canJoinTeam(player.id, team, cannotPairLookup)) {
            continue
          }

          const teamWeight = teamWeights[i] ?? 0
          const currentTarget = targetTeamIndex === -1 ? null : this.allTeams[targetTeamIndex]

          if (
            teamWeight < minWeight ||
            (teamWeight === minWeight &&
              currentTarget &&
              team.members.length < currentTarget.members.length)
          ) {
            minWeight = teamWeight
            targetTeamIndex = i
          }
        }

        if (targetTeamIndex === -1) {
          throw new Error(
            'Não foi possível montar equipes com as restrições atuais. Revise as regras de jogadores que não podem jogar juntos.',
          )
        }

        const team = this.allTeams[targetTeamIndex]
        if (team) {
          team.members.push({ ...player })
          teamWeights[targetTeamIndex] =
            (teamWeights[targetTeamIndex] ?? 0) + player.weight
        }
      })

      // Atualizar times red e blue com os primeiros da lista
      if (this.allTeams[0]) this.teams.red = { ...this.allTeams[0] }
      if (this.allTeams[1]) this.teams.blue = { ...this.allTeams[1] }

      this.saveTeams()
      this.saveAllTeams()
      return this.allTeams
    },

    drawRandomTeams(playersPerTeam: number) {
      const available = this.enabledPlayers
      if (available.length === 0) {
        throw new Error('Nenhum jogador habilitado para sorteio')
      }

      if (playersPerTeam < 1) {
        throw new Error('Número de jogadores por time deve ser maior que 0')
      }

      // Calcular número de times
      let numberOfTeams = Math.ceil(available.length / playersPerTeam)
      const completeTeams = Math.floor(available.length / playersPerTeam)
      const remainder = available.length % playersPerTeam
      const targetTeamSizes = [
        ...Array.from({ length: completeTeams }, () => playersPerTeam),
        ...(remainder > 0 ? [remainder] : []),
      ]

      this.allTeams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))
      const cannotPairLookup = this.buildCannotPairLookup()

      // Embaralhar todos os jogadores
      const shuffled = [...available].sort(() => Math.random() - 0.5)

      // Distribuir jogadores
      shuffled.forEach((player) => {
        let assigned = false

        for (let teamIndex = 0; teamIndex < numberOfTeams; teamIndex++) {
          const team = this.allTeams[teamIndex]
          const maxSize = targetTeamSizes[teamIndex] ?? 0

          if (!team || team.members.length >= maxSize) {
            continue
          }

          if (!this.canJoinTeam(player.id, team, cannotPairLookup)) {
            continue
          }

          team.members.push({ ...player })
          assigned = true
          break
        }

        if (!assigned) {
          throw new Error(
            'Não foi possível montar equipes com as restrições atuais. Revise as regras de jogadores que não podem jogar juntos.',
          )
        }
      })

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
