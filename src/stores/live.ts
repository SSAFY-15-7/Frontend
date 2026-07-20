import { defineStore } from 'pinia'

// 오너: FE2 — 소켓(STOMP) 이벤트로 갱신되는 라이브 상태.
// state 모양은 FE1·FE2 합의 초안이며, 실소켓 연결 시 FE2가 구체화한다.
// FE1 화면(예측 베팅·결과)도 이 스토어를 구독하므로 구조 변경은 상호 공유 후 진행.

export interface ChatMessage {
  id: number
  nickname: string
  text: string
  isQuestion: boolean // CHAT-06 질문 채팅
}

export const useLiveStore = defineStore('live', {
  state: () => ({
    roomId: null as number | null,
    endsAt: null as number | null, // 서버 권위 마감 시각 (epoch ms, BID-05)
    serverOffset: 0, // 서버-클라이언트 시각 보정값
    extensionCount: 0, // 판매자 연장 횟수 (최대 3회, BID-03)
    myBid: null as number | null, // 비크리 — 내 입찰가만 보임 (BID-06)
    vibeFeed: [] as string[], // "누군가 베팅 중...🔥" (BID-04)
    chat: [] as ChatMessage[],
  }),
})
