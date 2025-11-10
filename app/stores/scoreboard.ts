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
      const remainder = available.length % playersPerTeam

      // Se sobrar apenas 1 jogador, mesclar com o penúltimo time
      if (remainder === 1 && numberOfTeams > 1) {
        numberOfTeams = numberOfTeams - 1
      }

      const completeTeams = Math.floor(available.length / playersPerTeam)

      this.teams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      // Embaralhar jogadores primeiro
      const shuffledPlayers = [...available].sort(() => Math.random() - 0.5)
      // Ordenar por peso (maior para menor) para balancear
      const sortedPlayers = shuffledPlayers.sort((a, b) => b.weight - a.weight)

      // Distribuir jogadores de forma balanceada pelo peso
      sortedPlayers.forEach((player, index) => {
        // Calcular qual time deve receber o jogador
        // Primeiros (completeTeams * playersPerTeam) jogadores são distribuídos igualmente
        // O resto vai para o último time
        let targetTeamIndex: number

        if (index < completeTeams * playersPerTeam) {
          // Distribuir balanceado entre times completos
          // Encontrar o time com menor peso total que ainda não está completo
          let minWeight = Infinity
          targetTeamIndex = 0

          for (let i = 0; i < completeTeams; i++) {
            const team = this.teams[i]
            if (team && team.members.length < playersPerTeam) {
              const teamWeight = team.members.reduce(
                (sum, m) => sum + m.weight,
                0,
              )
              if (teamWeight < minWeight) {
                minWeight = teamWeight
                targetTeamIndex = i
              }
            }
          }
        } else {
          // Resto vai para o último time
          targetTeamIndex = numberOfTeams - 1
        }

        const team = this.teams[targetTeamIndex]
        if (team) {
          team.members.push({ ...player })
        }
      })

      this.saveTeams()
      return this.teams
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
      const remainder = available.length % playersPerTeam

      // Se sobrar apenas 1 jogador, mesclar com o penúltimo time
      if (remainder === 1 && numberOfTeams > 1) {
        numberOfTeams = numberOfTeams - 1
      }

      const completeTeams = Math.floor(available.length / playersPerTeam)

      this.teams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      // Embaralhar todos os jogadores
      const shuffled = [...available].sort(() => Math.random() - 0.5)

      // Distribuir jogadores
      shuffled.forEach((player, index) => {
        // Primeiros jogadores são distribuídos nos times completos (playersPerTeam cada)
        // Resto vai para o último time
        let teamIndex: number

        if (index < completeTeams * playersPerTeam) {
          // Distribui nos times completos
          teamIndex = Math.floor(index / playersPerTeam)
        } else {
          // Resto vai para o último time
          teamIndex = numberOfTeams - 1
        }

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
