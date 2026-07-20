import { defineStore } from 'pinia'

// 오너: FE1 (PRED-01~04) — 낙찰가 예측 베팅
export interface PredictionBucket {
  min: number
  max: number
  ratio: number // 전체 베팅 중 이 구간 비율 (0~1)
}

export const usePredictionStore = defineStore('prediction', {
  state: () => ({
    buckets: [] as PredictionBucket[],
    myPrediction: null as number | null, // 내가 입력한 정확 예측가
    myStake: 0,
  }),
})
