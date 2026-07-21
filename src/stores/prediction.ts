import { defineStore } from 'pinia'

// 오너: FE1 (PRED-01~05) — 낙찰가 예측 베팅
// 구간(bucket) 파리뮤추얼은 폐기된 구 설계다. 현행은 금액 직접 입력 + 오차율 고정 배당.

/** 낙찰가 대비 오차율 밴드 (PRED-03) */
export type PredictionBand = 'WITHIN_1' | 'WITHIN_3' | 'WITHIN_5' | 'MISS'

/** 밴드별 고정 배수 — 베팅 시점에 확정된다 */
export const BAND_MULTIPLIER: Record<PredictionBand, number> = {
  WITHIN_1: 5,
  WITHIN_3: 3,
  WITHIN_5: 1, // 원금 반환
  MISS: 0,
}

/** PRED-02 결과 분포 — 경매 종료·정산 완료 후에만 채워진다 (진행 중 조회 시 409) */
export interface BandResult {
  band: PredictionBand
  participantCount: number
  multiplier: number
  totalPayoutAmount: number
}

export const usePredictionStore = defineStore('prediction', {
  state: () => ({
    myPrediction: null as number | null, // predictedPrice — 금액 직접 입력, 구간·상한 없음 (PRED-01)
    myStake: 0, // stakeAmount — 베팅 포인트
    bands: [] as BandResult[], // 종료 후에만 공개. 라이브 중 분포 노출 금지 (herding 방지)
  }),
  getters: {
    // 베팅 전 실수령 BP 미리보기용. 정산 자체는 서버가 한다 (PRED-03).
    estimatedPayout: (state) => (band: PredictionBand) => state.myStake * BAND_MULTIPLIER[band],
  },
})
