import { io, type Socket } from 'socket.io-client'
import type { Player, Team, Teams } from '~/stores/scoreboard'

interface RoomData {
  code: string
  hostName: string
  participants: { id: string; name: string }[]
  players: Player[]
  teams: Teams
  allTeams: Team[]
}

let socket: Socket | null = null

export const useSocket = () => {
  const config = useRuntimeConfig()
  const socketStore = useSocketStore()

  const connect = () => {
    if (socket?.connected) {
      socketStore.setConnected(true)
      return
    }

    // Sempre usa servidor Socket.IO standalone em localhost:3001
    const socketUrl = (config.public.socketUrl as string) || 'http://localhost:5152'

    console.log('Socket.IO connecting to:', socketUrl)

    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      socketStore.setConnected(true)
      console.log('✅ Connected to Socket.IO server')
    })

    socket.on('disconnect', () => {
      socketStore.setConnected(false)
      console.log('❌ Disconnected from Socket.IO server')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
      socketStore.clearRoom()
      socketStore.setConnected(false)
    }
  }

  const createRoom = async (hostName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'))
        return
      }

      socket.emit(
        'create-room',
        { hostName },
        (response: { success: boolean; roomCode?: string; error?: string }) => {
          if (response.success && response.roomCode) {
            socketStore.setRoomCode(response.roomCode)
            socketStore.setIsHost(true)
            socketStore.setParticipants([{ id: socket?.id || '', name: hostName }])
            resolve(response.roomCode)
          } else {
            reject(new Error(response.error || 'Erro ao criar sala'))
          }
        },
      )
    })
  }

  const joinRoom = async (
    code: string,
    participantName: string,
  ): Promise<RoomData> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'))
        return
      }

      socket.emit(
        'join-room',
        { roomCode: code, participantName },
        (response: {
          success: boolean
          isHost?: boolean
          room?: RoomData
          error?: string
        }) => {
          if (response.success && response.room) {
            socketStore.setRoomCode(code)
            socketStore.setIsHost(response.isHost || false)
            socketStore.setParticipants(response.room.participants)
            resolve(response.room)
          } else {
            reject(new Error(response.error || 'Erro ao entrar na sala'))
          }
        },
      )
    })
  }

  const syncPlayers = (players: Player[]) => {
    if (!socket || !socketStore.isHost || !socketStore.roomCode) return
    socket.emit('sync-players', { roomCode: socketStore.roomCode, players })
  }

  const syncTeams = (teams: Teams, allTeams: Team[]) => {
    if (!socket || !socketStore.isHost || !socketStore.roomCode) return
    socket.emit('sync-teams', { roomCode: socketStore.roomCode, teams, allTeams })
  }

  const syncScore = (color: 'red' | 'blue', score: number) => {
    if (!socket || !socketStore.roomCode) return
    socket.emit('sync-score', { roomCode: socketStore.roomCode, color, score })
  }

  const syncResetScores = () => {
    if (!socket || !socketStore.isHost || !socketStore.roomCode) return
    socket.emit('sync-reset-scores', { roomCode: socketStore.roomCode })
  }

  // Event listeners
  const onParticipantJoined = (
    callback: (data: { participants: { id: string; name: string }[] }) => void,
  ) => {
    socket?.on('participant-joined', (data) => {
      socketStore.setParticipants(data.participants)
      callback(data)
    })
  }

  const onParticipantLeft = (
    callback: (data: { participants: { id: string; name: string }[] }) => void,
  ) => {
    socket?.on('participant-left', (data) => {
      socketStore.setParticipants(data.participants)
      callback(data)
    })
  }

  const onPlayersUpdated = (callback: (data: { players: Player[] }) => void) => {
    socket?.on('players-updated', callback)
  }

  const onTeamsUpdated = (
    callback: (data: { teams: Teams; allTeams: Team[] }) => void,
  ) => {
    socket?.on('teams-updated', callback)
  }

  const onScoreUpdated = (
    callback: (data: { color: string; score: number }) => void,
  ) => {
    socket?.on('score-updated', callback)
  }

  const onScoresReset = (callback: () => void) => {
    socket?.on('scores-reset', callback)
  }

  const onRoomClosed = (callback: (data: { message: string }) => void) => {
    socket?.on('room-closed', (data) => {
      socketStore.clearRoom()
      callback(data)
    })
  }

  const leaveRoom = () => {
    disconnect()
  }

  return {
    connected: computed(() => socketStore.connected),
    roomCode: computed(() => socketStore.roomCode),
    isHost: computed(() => socketStore.isHost),
    participants: computed(() => socketStore.participants),
    connect,
    disconnect,
    createRoom,
    joinRoom,
    syncPlayers,
    syncTeams,
    syncScore,
    syncResetScores,
    onParticipantJoined,
    onParticipantLeft,
    onPlayersUpdated,
    onTeamsUpdated,
    onScoreUpdated,
    onScoresReset,
    onRoomClosed,
    leaveRoom,
  }
}
