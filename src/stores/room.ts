import { defineStore } from 'pinia'

// 오너: FE1 (ROOM-01~07)
export type RoomStatus = 'scheduled' | 'waiting' | 'live' | 'ended'

export interface RoomSummary {
  id: number
  title: string
  status: RoomStatus
}

export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [] as RoomSummary[],
  }),
})
