// ROOM-02 방 목록 목 데이터 — 디자인 단일 소스(비드라이브 인터랙티브.html)의 ROOMS 배열 기반
// 비크리 비공개 원칙: 진행 중 방에는 현재 최고가·타인 입찰 금액을 두지 않는다.
// 공개 가능: 시작가·입찰 건수·참여/시청자 수. 낙찰가(soldPrice)는 종료된 방에서만 공개.

export type RoomState = 'live' | 'waiting' | 'ended'

export interface Room {
  id: number
  title: string
  category: string
  state: RoomState
  /** 시작가(하한가), 포인트 단위 */
  startPrice: number
  /** 입찰 건수 (live) */
  bidCount: number
  /** 참여 인원 — live는 입찰 참여자, waiting은 대기 인원 */
  participantCount: number
  /** 시청자 수 (live) */
  viewerCount: number
  /** live: 종료까지 남은 초 — 서버 응답 스냅샷 값. 목록에서는 요약 표시만 한다 (BID-05) */
  endsInSec?: number
  /** waiting: 시작 예정 시각 표시 문자열 */
  startsAtLabel?: string
  /** ended: 종료 시점 표시 문자열 */
  endedAtLabel?: string
  /** ended: 낙찰가 — 종료 후에만 공개 */
  soldPrice?: number
}

export const mockRooms: Room[] = [
  // ── 진행중 (live) ──
  {
    id: 1,
    title: '기계식 키보드 커스텀 풀빌드 (저소음 적축)',
    category: '전자기기',
    state: 'live',
    startPrice: 30000,
    bidCount: 12,
    participantCount: 9,
    viewerCount: 24,
    endsInSec: 252,
  },
  {
    id: 2,
    title: '한정판 피규어 미개봉',
    category: '취미·수집',
    state: 'live',
    startPrice: 50000,
    bidCount: 7,
    participantCount: 15,
    viewerCount: 41,
    endsInSec: 748,
  },
  {
    id: 3,
    title: '아트토이 굿즈 컬렉션 (3종)',
    category: '취미·수집',
    state: 'live',
    startPrice: 25000,
    bidCount: 9,
    participantCount: 20,
    viewerCount: 33,
    endsInSec: 119,
  },
  {
    id: 4,
    title: '스니커즈 한정 컬래버',
    category: '패션·잡화',
    state: 'live',
    startPrice: 90000,
    bidCount: 15,
    participantCount: 29,
    viewerCount: 52,
    endsInSec: 187,
  },
  // ── 대기 (waiting) — 채팅만 활성, 입찰·베팅 잠금 (ROOM-07) ──
  {
    id: 5,
    title: '라이카 M6 필름 바디',
    category: '전자기기',
    state: 'waiting',
    startPrice: 450000,
    bidCount: 0,
    participantCount: 12,
    viewerCount: 0,
    startsAtLabel: '오늘 20:20',
  },
  {
    id: 6,
    title: '한정판 스니커즈 US 270',
    category: '패션·잡화',
    state: 'waiting',
    startPrice: 220000,
    bidCount: 0,
    participantCount: 31,
    viewerCount: 0,
    startsAtLabel: '오늘 21:00',
  },
  {
    id: 7,
    title: '수제 도자기 다기 세트',
    category: '생활용품',
    state: 'waiting',
    startPrice: 40000,
    bidCount: 0,
    participantCount: 2,
    viewerCount: 0,
    startsAtLabel: '토요일 19:00',
  },
  // ── 종료 (ended) — 낙찰가는 종료 후에만 공개 ──
  {
    id: 8,
    title: '스니커즈 한정 컬래버 (2차)',
    category: '패션·잡화',
    state: 'ended',
    startPrice: 70000,
    bidCount: 9,
    participantCount: 14,
    viewerCount: 0,
    endedAtLabel: '어제',
    soldPrice: 90000,
  },
  {
    id: 9,
    title: '미니 턴테이블 + LP 5장',
    category: '도서·음반',
    state: 'ended',
    startPrice: 80000,
    bidCount: 6,
    participantCount: 11,
    viewerCount: 0,
    endedAtLabel: '2일 전',
    soldPrice: 128000,
  },
]
