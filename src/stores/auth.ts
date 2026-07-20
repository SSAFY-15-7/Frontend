import { defineStore } from 'pinia'

// 오너: FE1 (MEM-01~02)
export interface UserProfile {
  id: number
  nickname: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserProfile | null,
  }),
  getters: {
    isLoggedIn: (state) => state.user !== null,
  },
})
