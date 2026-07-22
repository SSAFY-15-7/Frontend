import { defineStore } from 'pinia'
import { mockRooms, type Room, type RoomState } from '@/mocks/rooms'

export type { Room, RoomState }

// 오너: FE1 (ROOM-01~07)
export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [] as Room[],
    loaded: false,
  }),
  actions: {
    // ROOM-02 방 목록 조회
    loadRooms() {
      // TODO: http.ts 경유 실API로 교체 (GET /rooms) — shared/api/http.ts의 axios 인스턴스만 사용
      this.rooms = mockRooms
      this.loaded = true
    },
  },
})
