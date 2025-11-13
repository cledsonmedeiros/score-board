import { defineStore } from 'pinia'

interface Participant {
  id: string
  name: string
}

export const useSocketStore = defineStore('socket', {
  state: () => ({
    connected: false,
    roomCode: null as string | null,
    isHost: false,
    participants: [] as Participant[],
  }),

  actions: {
    setConnected(value: boolean) {
      this.connected = value
    },

    setRoomCode(code: string | null) {
      this.roomCode = code
    },

    setIsHost(value: boolean) {
      this.isHost = value
    },

    setParticipants(value: Participant[]) {
      this.participants = value
    },

    addParticipant(participant: Participant) {
      this.participants.push(participant)
    },

    clearRoom() {
      this.roomCode = null
      this.isHost = false
      this.participants = []
    },
  },
})
