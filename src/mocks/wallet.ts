// PNT-01·02 지갑·원장 목 데이터 — 백엔드 스키마(`wallet`, `trade_point_ledger`, `betting_point_ledger`) 기준.
// 참조: docs/04-백엔드-스키마-메모.md §3.5
//
// 스키마 반영 사항
// - `wallet`: UNIQUE(member_id, wallet_type), wallet_type IN ('TRADE','BETTING')
//   → 회원 1명당 지갑 2행. availableBalance/heldBalance는 별개 컬럼이고 둘 다 >= 0.
//   → availableBalance는 **이미 보류를 제외한 값**이다. 총 보유 = available + held.
// - 원장은 두 테이블로 분리(`trade_point_ledger`/`betting_point_ledger`)되고 append-only다.
//   두 테이블 모두 availableDelta·heldDelta를 함께 가지며 CHECK(available_delta <> 0 OR held_delta <> 0).
//   → 홀드 행은 availableDelta=-X / heldDelta=+X로 총합이 변하지 않는다(원장 UI에서 "증감 0"으로 보이면 안 됨).
// - `*_balance_after`가 함께 저장되므로 각 행 시점의 잔액을 표시할 수 있다.

/** `wallet.wallet_type` */
export type WalletType = 'TRADE' | 'BETTING'

/** `wallet` 1행 */
export interface Wallet {
  /** `wallet.wallet_id` (BIGINT — 직렬화 형식은 BE 확인 필요) */
  walletId: number
  walletType: WalletType
  /** `available_balance` — 보류를 이미 제외한 사용 가능 잔액 (>= 0) */
  availableBalance: number
  /** `held_balance` — 보류 중 잔액 (>= 0) */
  heldBalance: number
}

/**
 * `trade_point_ledger.transaction_type` / `betting_point_ledger.transaction_type`
 * 스키마상 VARCHAR(40)이고 **CHECK 제약이 없어 값 목록을 알 수 없다** (docs/04 §6.1).
 * 아래 값은 FE가 화면을 만들기 위해 임시로 정한 것이며 **BE 확인 필요**.
 */
export type TradeTransactionType =
  | 'CHARGE' // 포인트 충전 승인
  | 'WITHDRAW' // 출금 신청 차감
  | 'BID_HOLD' // 입찰 시 보류
  | 'BID_HOLD_RELEASE' // 미낙찰 보류 해제
  | 'BID_HOLD_PARTIAL_RELEASE' // 2등가 낙찰로 생긴 홀드 차액 복구
  | 'DEAL_PAYMENT' // 낙찰 결제 차감
  | 'DEAL_SETTLEMENT' // 판매 정산 입금

export type BettingTransactionType =
  | 'SIGNUP_REWARD' // 가입 축하 지급
  | 'ATTENDANCE_REWARD' // 출석 보상
  | 'WATCH_REWARD' // 라이브 시청 보상
  | 'PREDICTION_HOLD' // 예측 베팅 스테이크 보류
  | 'PREDICTION_PAYOUT' // 적중 배당 지급 (보류 해제 + 배당)
  | 'PREDICTION_LOSS' // 미적중 스테이크 소멸

export type LedgerTransactionType = TradeTransactionType | BettingTransactionType

/** `trade_point_ledger`/`betting_point_ledger` 공통 형태 (FE 표현용 병합 타입) */
export interface LedgerEntry {
  /** `*_point_ledger_id` */
  id: number
  walletType: WalletType
  transactionType: LedgerTransactionType
  /** `available_delta` — 부호 있음 */
  availableDelta: number
  /** `held_delta` — 부호 있음 */
  heldDelta: number
  /** `available_balance_after` */
  availableBalanceAfter: number
  /** `held_balance_after` */
  heldBalanceAfter: number
  /** `created_at` — 서버는 TIMESTAMPTZ. 목은 epoch ms (포맷은 BE 확인 필요, docs/04 §6.3) */
  createdAt: number
  /**
   * 화면 설명 문구. 스키마에는 없고 FK(`bid_id`·`deal_id`·`point_charge_id`·`prediction_id` 등)를
   * 조인해 만들어야 하는 값이다 — 목에서는 완성된 문자열로 둔다.
   */
  description: string
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// 목 데이터는 모듈 로드 시각 기준으로 상대 시각을 만든다 (고정 epoch를 박으면 나중에 열었을 때 어색해진다).
// TODO: shared/api/http.ts 경유 실API로 교체 — 서버가 created_at을 내려주므로 이 계산은 삭제한다.
const now = Date.now()

export const mockWallets: Wallet[] = [
  // 거래 지갑 — 충전·출금 가능. 진행 중인 입찰 1건이 보류로 잡혀 있다.
  { walletId: 1, walletType: 'TRADE', availableBalance: 128_000, heldBalance: 82_000 },
  // 베팅 지갑 — 무료 재화(충전·출금·상호 전환 없음). 예측 1건이 보류 중.
  { walletId: 2, walletType: 'BETTING', availableBalance: 2_950, heldBalance: 300 },
]

// ── 거래 포인트 원장 (`trade_point_ledger`) — 최신순 ──
export const mockTradeLedger: LedgerEntry[] = [
  {
    id: 1011,
    walletType: 'TRADE',
    transactionType: 'BID_HOLD',
    availableDelta: -82_000,
    heldDelta: 82_000, // 총합 0 — 원장 UI는 이 행을 "보류"로 표기해야 한다
    availableBalanceAfter: 128_000,
    heldBalanceAfter: 82_000,
    createdAt: now - 26 * MINUTE,
    description: '기계식 키보드 커스텀 풀빌드 · 입찰 보류',
  },
  {
    id: 1010,
    walletType: 'TRADE',
    transactionType: 'CHARGE',
    availableDelta: 100_000,
    heldDelta: 0,
    availableBalanceAfter: 210_000,
    heldBalanceAfter: 0,
    createdAt: now - 3 * HOUR,
    description: '카카오페이 충전 · 테스트 결제',
  },
  {
    id: 1009,
    walletType: 'TRADE',
    transactionType: 'DEAL_PAYMENT',
    availableDelta: 0,
    heldDelta: -74_000, // 보류분이 그대로 결제로 빠진다
    availableBalanceAfter: 110_000,
    heldBalanceAfter: 0,
    createdAt: now - DAY - 2 * HOUR,
    description: '빈티지 필름 카메라 세트 · 낙찰 결제(2등가)',
  },
  {
    id: 1008,
    walletType: 'TRADE',
    transactionType: 'BID_HOLD_PARTIAL_RELEASE',
    availableDelta: 8_000,
    heldDelta: -8_000, // 총합 0 — 2등가 낙찰로 생긴 홀드 차액 복구
    availableBalanceAfter: 110_000,
    heldBalanceAfter: 74_000,
    createdAt: now - DAY - 2 * HOUR,
    description: '빈티지 필름 카메라 세트 · 홀드 차액 복구',
  },
  {
    id: 1007,
    walletType: 'TRADE',
    transactionType: 'BID_HOLD',
    availableDelta: -82_000,
    heldDelta: 82_000,
    availableBalanceAfter: 102_000,
    heldBalanceAfter: 82_000,
    createdAt: now - DAY - 3 * HOUR,
    description: '빈티지 필름 카메라 세트 · 입찰 보류',
  },
  {
    id: 1006,
    walletType: 'TRADE',
    transactionType: 'BID_HOLD_RELEASE',
    availableDelta: 61_000,
    heldDelta: -61_000, // 총합 0 — 미낙찰 보류 해제
    availableBalanceAfter: 184_000,
    heldBalanceAfter: 0,
    createdAt: now - 2 * DAY,
    description: '헤드폰 하이엔드 오픈형 · 미낙찰 보류 해제',
  },
  {
    id: 1005,
    walletType: 'TRADE',
    transactionType: 'BID_HOLD',
    availableDelta: -61_000,
    heldDelta: 61_000,
    availableBalanceAfter: 123_000,
    heldBalanceAfter: 61_000,
    createdAt: now - 2 * DAY - 40 * MINUTE,
    description: '헤드폰 하이엔드 오픈형 · 입찰 보류',
  },
  {
    id: 1004,
    walletType: 'TRADE',
    transactionType: 'DEAL_SETTLEMENT',
    availableDelta: 96_000,
    heldDelta: 0,
    availableBalanceAfter: 184_000,
    heldBalanceAfter: 0,
    createdAt: now - 4 * DAY,
    description: '미니 턴테이블 + LP 5장 · 판매 정산',
  },
  {
    id: 1003,
    walletType: 'TRADE',
    transactionType: 'WITHDRAW',
    availableDelta: -50_000,
    heldDelta: 0,
    availableBalanceAfter: 88_000,
    heldBalanceAfter: 0,
    createdAt: now - 6 * DAY,
    description: '국민은행 123456-78-901234 · 출금',
  },
  {
    id: 1002,
    walletType: 'TRADE',
    transactionType: 'CHARGE',
    availableDelta: 50_000,
    heldDelta: 0,
    availableBalanceAfter: 138_000,
    heldBalanceAfter: 0,
    createdAt: now - 9 * DAY,
    description: '신용·체크카드 충전 · 테스트 결제',
  },
  {
    id: 1001,
    walletType: 'TRADE',
    transactionType: 'CHARGE',
    availableDelta: 88_000,
    heldDelta: 0,
    availableBalanceAfter: 88_000,
    heldBalanceAfter: 0,
    createdAt: now - 21 * DAY,
    description: '카카오페이 충전 · 테스트 결제',
  },
]

// ── 베팅 포인트 원장 (`betting_point_ledger`) — 최신순 ──
export const mockBettingLedger: LedgerEntry[] = [
  {
    id: 2009,
    walletType: 'BETTING',
    transactionType: 'PREDICTION_HOLD',
    availableDelta: -300,
    heldDelta: 300, // 총합 0
    availableBalanceAfter: 2_950,
    heldBalanceAfter: 300,
    createdAt: now - 48 * MINUTE,
    description: '아트토이 굿즈 컬렉션 · 낙찰가 예측 스테이크 보류',
  },
  {
    id: 2008,
    walletType: 'BETTING',
    transactionType: 'WATCH_REWARD',
    availableDelta: 50,
    heldDelta: 0,
    availableBalanceAfter: 3_250,
    heldBalanceAfter: 0,
    createdAt: now - 5 * HOUR,
    description: '라이브 시청 보상',
  },
  {
    id: 2007,
    walletType: 'BETTING',
    transactionType: 'PREDICTION_PAYOUT',
    availableDelta: 900, // 보류 해제 + 배당이 한 행에 기록된 경우 (스테이크 300 × 3)
    heldDelta: -300,
    availableBalanceAfter: 3_200,
    heldBalanceAfter: 0,
    createdAt: now - DAY - HOUR,
    description: '한정판 피규어 미개봉 · 오차 3% 이내 적중 ×3',
  },
  {
    id: 2006,
    walletType: 'BETTING',
    transactionType: 'PREDICTION_HOLD',
    availableDelta: -300,
    heldDelta: 300,
    availableBalanceAfter: 2_300,
    heldBalanceAfter: 300,
    createdAt: now - DAY - 2 * HOUR,
    description: '한정판 피규어 미개봉 · 낙찰가 예측 스테이크 보류',
  },
  {
    id: 2005,
    walletType: 'BETTING',
    transactionType: 'ATTENDANCE_REWARD',
    availableDelta: 50,
    heldDelta: 0,
    availableBalanceAfter: 2_600,
    heldBalanceAfter: 0,
    createdAt: now - 2 * DAY,
    description: '출석 보상',
  },
  {
    id: 2004,
    walletType: 'BETTING',
    transactionType: 'PREDICTION_LOSS',
    availableDelta: 0,
    heldDelta: -500, // 미적중 — 보류분이 그대로 소멸
    availableBalanceAfter: 2_550,
    heldBalanceAfter: 0,
    createdAt: now - 3 * DAY,
    description: '레트로 게임 콘솔 + 타이틀 · 미적중 ×0',
  },
  {
    id: 2003,
    walletType: 'BETTING',
    transactionType: 'PREDICTION_HOLD',
    availableDelta: -500,
    heldDelta: 500,
    availableBalanceAfter: 2_550,
    heldBalanceAfter: 500,
    createdAt: now - 3 * DAY - 3 * HOUR,
    description: '레트로 게임 콘솔 + 타이틀 · 낙찰가 예측 스테이크 보류',
  },
  {
    id: 2002,
    walletType: 'BETTING',
    transactionType: 'ATTENDANCE_REWARD',
    availableDelta: 50,
    heldDelta: 0,
    availableBalanceAfter: 3_050,
    heldBalanceAfter: 0,
    createdAt: now - 5 * DAY,
    description: '출석 보상',
  },
  {
    id: 2001,
    walletType: 'BETTING',
    transactionType: 'SIGNUP_REWARD',
    availableDelta: 3_000,
    heldDelta: 0,
    availableBalanceAfter: 3_000,
    heldBalanceAfter: 0,
    createdAt: now - 16 * DAY,
    description: '가입 축하 지급',
  },
]
