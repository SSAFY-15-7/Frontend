import { defineStore } from 'pinia'

// 오너: FE1 (PNT-01~02) — 거래/베팅 이중 지갑. 상호 전환 금지.
export const useWalletStore = defineStore('wallet', {
  state: () => ({
    tradePoint: 0, // 거래 포인트: 충전·환불, 입찰 전용
    tradeHold: 0, // 입찰 홀드 중 금액
    betPoint: 0, // 베팅 포인트: 무료 재화, 예측 베팅 전용
  }),
  getters: {
    tradeAvailable: (state) => state.tradePoint - state.tradeHold,
  },
})
