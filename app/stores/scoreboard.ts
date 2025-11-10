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

const STORAGE_KEY = 'scoreboard-players'
const TEAMS_STORAGE_KEY = 'scoreboard-teams'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    players: [] as Player[],
    teams: [
      { name: 'EQUIPE 1', score: 0, members: [] },
      { name: 'EQUIPE 2', score: 0, members: [] },
    ] as Team[],
  }),

  getters: {
    enabledPlayers: (state) => state.players.filter((p) => p.enabled),
  },

  actions: {
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

    loadTeams() {
      if (import.meta.client) {
        const stored = localStorage.getItem(TEAMS_STORAGE_KEY)
        if (stored) {
          try {
            this.teams = JSON.parse(stored)
          } catch (e) {
            console.error('Erro ao carregar equipes:', e)
            this.teams = [
              { name: 'EQUIPE 1', score: 0, members: [] },
              { name: 'EQUIPE 2', score: 0, members: [] },
            ]
          }
        }
      }
    },

    saveTeams() {
      if (import.meta.client) {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(this.teams))
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
        return true
      }
      return false
    },

    updatePlayer(playerId: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) {
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
    drawTeams(numberOfTeams: number = 2) {
      const available = this.enabledPlayers
      if (available.length === 0) {
        throw new Error('Nenhum jogador habilitado para sorteio')
      }

      this.teams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      const shuffledPlayers = [...available].sort(() => Math.random() - 0.5)
      const sortedPlayers = shuffledPlayers.sort((a, b) => b.weight - a.weight)

      sortedPlayers.forEach((player) => {
        const teamWeights = this.teams.map((team) =>
          team.members.reduce((sum, member) => sum + member.weight, 0)
        )
        const minWeightIndex = teamWeights.indexOf(Math.min(...teamWeights))
        const team = this.teams[minWeightIndex]

        if (team) {
          team.members.push({ ...player })
        }
      })

      this.saveTeams()
      return this.teams
    },

    drawRandomTeams(numberOfTeams: number = 2) {
      const available = this.enabledPlayers
      if (available.length === 0) {
        throw new Error('Nenhum jogador habilitado para sorteio')
      }

      this.teams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      const shuffled = [...available].sort(() => Math.random() - 0.5)

      shuffled.forEach((player, index) => {
        const teamIndex = index % numberOfTeams
        const team = this.teams[teamIndex]

        if (team) {
          team.members.push({ ...player })
        }
      })

      this.saveTeams()
      return this.teams
    },

    incrementTeamScore(teamIndex: number) {
      const team = this.teams[teamIndex]
      if (team) {
        team.score++
        this.saveTeams()
      }
    },

    decrementTeamScore(teamIndex: number) {
      const team = this.teams[teamIndex]
      if (team && team.score > 0) {
        team.score--
        this.saveTeams()
      }
    },

    resetScores() {
      this.teams.forEach((team) => {
        team.score = 0
      })
      this.saveTeams()
    },

    // Initialize
    init() {
      this.loadPlayers()
      this.loadTeams()
    },
  },
})
