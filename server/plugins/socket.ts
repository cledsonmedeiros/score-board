import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

import type { NitroApp } from 'nitropack'

interface Player {
  id: string
  name: string
  weight: number
  enabled: boolean
  createdAt: number
}

interface Team {
  name: string
  score: number
  members: Player[]
}

interface Room {
  code: string
  hostId: string
  hostName: string
  participants: Map<string, string> // socketId -> name
  players: Player[]
  teams: {
    red: Team
    blue: Team
  }
  allTeams: Team[]
  createdAt: number
}

const rooms = new Map<string, Room>()

function generateRoomCode(): string {
  let code: string
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
  } while (rooms.has(code))
  return code
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  if (!import.meta.dev) {
    console.log('⏭️  Socket.IO: Skipping in production build')
    return
  }

  // @ts-ignore - Nitro server has h3 instance
  const server = nitroApp.h3App?.websocket?.server || nitroApp.h3App?.server

  if (!server) {
    console.warn('⚠️  Socket.IO: Creating standalone server for development')
    // Em desenvolvimento, cria um servidor separado com Express
    const app = express()
    const httpServer = createServer(app)
    
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        credentials: true,
      },
      transports: ['polling', 'websocket'],
    })

    setupSocketHandlers(io)
    
    httpServer.listen(3001, () => {
      console.log('✅ Socket.IO server initialized on port 3001')
    })
    
    return
  }

  const io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
    transports: ['polling', 'websocket'],
  })

  console.log('✅ Socket.IO server initialized')
  setupSocketHandlers(io)
})

function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id)

    // Criar sala
    socket.on('create-room', ({ hostName }, callback) => {
      const roomCode = generateRoomCode()
      const room: Room = {
        code: roomCode,
        hostId: socket.id,
        hostName,
        participants: new Map([[socket.id, hostName]]),
        players: [],
        teams: {
          red: { name: 'EQUIPE 1', score: 0, members: [] },
          blue: { name: 'EQUIPE 2', score: 0, members: [] },
        },
        allTeams: [],
        createdAt: Date.now(),
      }

      rooms.set(roomCode, room)
      socket.join(roomCode)

      console.log(`🎮 Room created: ${roomCode} by ${hostName}`)

      callback({
        success: true,
        roomCode,
        isHost: true,
      })
    })

    // Entrar na sala
    socket.on('join-room', ({ roomCode, participantName }, callback) => {
      const room = rooms.get(roomCode)

      if (!room) {
        callback({ success: false, error: 'Sala não encontrada' })
        return
      }

      socket.join(roomCode)
      room.participants.set(socket.id, participantName)

      console.log(`👤 ${participantName} joined room ${roomCode}`)

      // Envia estado atual da sala para o novo participante
      callback({
        success: true,
        isHost: false,
        room: {
          code: room.code,
          hostName: room.hostName,
          participants: Array.from(room.participants.entries()).map(
            ([id, name]) => ({ id, name }),
          ),
          players: room.players,
          teams: room.teams,
          allTeams: room.allTeams,
        },
      })

      // Notifica todos sobre o novo participante
      io.to(roomCode).emit('participant-joined', {
        participants: Array.from(room.participants.entries()).map(
          ([id, name]) => ({ id, name }),
        ),
      })
    })

    // Sincronizar jogadores
    socket.on('sync-players', ({ roomCode, players }) => {
      const room = rooms.get(roomCode)
      if (room && room.hostId === socket.id) {
        room.players = players
        socket.to(roomCode).emit('players-updated', { players })
      }
    })

    // Sincronizar times sorteados
    socket.on('sync-teams', ({ roomCode, teams, allTeams }) => {
      const room = rooms.get(roomCode)
      if (room && room.hostId === socket.id) {
        room.teams = teams
        room.allTeams = allTeams
        socket.to(roomCode).emit('teams-updated', { teams, allTeams })
      }
    })

    // Sincronizar placar
    socket.on('sync-score', ({ roomCode, color, score }) => {
      const room = rooms.get(roomCode)
      if (room) {
        room.teams[color as 'red' | 'blue'].score = score
        socket.to(roomCode).emit('score-updated', { color, score })
      }
    })

    // Resetar placares
    socket.on('sync-reset-scores', ({ roomCode }) => {
      const room = rooms.get(roomCode)
      if (room && room.hostId === socket.id) {
        room.teams.red.score = 0
        room.teams.blue.score = 0
        socket.to(roomCode).emit('scores-reset')
      }
    })

    // Desconexão
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)

      // Limpar salas onde o host desconectou
      rooms.forEach((room, code) => {
        if (room.hostId === socket.id) {
          console.log(`🗑️  Room closed: ${code}`)
          io.to(code).emit('room-closed', {
            message: 'O host encerrou a sessão',
          })
          rooms.delete(code)
        } else if (room.participants.has(socket.id)) {
          // Remove participante
          const name = room.participants.get(socket.id)
          room.participants.delete(socket.id)
          console.log(`👋 ${name} left room ${code}`)

          io.to(code).emit('participant-left', {
            participants: Array.from(room.participants.entries()).map(
              ([id, name]) => ({ id, name }),
            ),
          })
        }
      })
    })
  })

  // Limpar salas antigas (mais de 24 horas)
  setInterval(
    () => {
      const now = Date.now()
      const dayInMs = 24 * 60 * 60 * 1000

      rooms.forEach((room, code) => {
        if (now - room.createdAt > dayInMs) {
          console.log(`🗑️  Cleaning old room: ${code}`)
          io.to(code).emit('room-closed', {
            message: 'Sala expirou (24h)',
          })
          rooms.delete(code)
        }
      })
    },
    60 * 60 * 1000,
  ) // Roda a cada hora

  console.log('✅ Socket.IO event handlers registered')
}
