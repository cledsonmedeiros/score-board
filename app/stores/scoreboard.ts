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

export type TeamColor = 'red' | 'blue'

export interface Teams {
  red: Team
  blue: Team
}

const STORAGE_KEY = 'scoreboard-players'
const TEAMS_STORAGE_KEY = 'scoreboard-teams'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    players: [] as Player[],
    teams: {
      red: { name: 'EQUIPE 1', score: 0, members: [] },
      blue: { name: 'EQUIPE 2', score: 0, members: [] },
    } as Teams,
    allTeams: [] as Team[], // Para sortear múltiplas equipes
  }),

  getters: {
    enabledPlayers: (state) => state.players.filter((p) => p.enabled),
    redTeam: (state) => state.teams.red,
    blueTeam: (state) => state.teams.blue,
    availableTeams: (state) => state.allTeams.filter((t) => t.members.length > 0),
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

      this.allTeams = Array.from({ length: numberOfTeams }, (_, i) => ({
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
        let targetTeamIndex: number

        if (index < completeTeams * playersPerTeam) {
          // Distribuir balanceado entre times completos
          let minWeight = Infinity
          targetTeamIndex = 0

          for (let i = 0; i < completeTeams; i++) {
            const team = this.allTeams[i]
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

        const team = this.allTeams[targetTeamIndex]
        if (team) {
          team.members.push({ ...player })
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
      const remainder = available.length % playersPerTeam

      // Se sobrar apenas 1 jogador, mesclar com o penúltimo time
      if (remainder === 1 && numberOfTeams > 1) {
        numberOfTeams = numberOfTeams - 1
      }

      const completeTeams = Math.floor(available.length / playersPerTeam)

      this.allTeams = Array.from({ length: numberOfTeams }, (_, i) => ({
        name: `EQUIPE ${i + 1}`,
        score: 0,
        members: [],
      }))

      // Embaralhar todos os jogadores
      const shuffled = [...available].sort(() => Math.random() - 0.5)

      // Distribuir jogadores
      shuffled.forEach((player, index) => {
        let teamIndex: number

        if (index < completeTeams * playersPerTeam) {
          // Distribui nos times completos
          teamIndex = Math.floor(index / playersPerTeam)
        } else {
          // Resto vai para o último time
          teamIndex = numberOfTeams - 1
        }

        const team = this.allTeams[teamIndex]
        if (team) {
          team.members.push({ ...player })
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
      }
    },

    // Initialize
    init() {
      this.loadPlayers()
      this.loadTeams()
    },
  },
})
