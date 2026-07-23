// PNT-02 원장 행 표기 규칙 — `trade_point_ledger`·`betting_point_ledger`의 두 델타를 화면 문구로 옮긴다.
// 참조: docs/04-백엔드-스키마-메모.md §3.5
import type { LedgerEntry, LedgerTransactionType } from '@/mocks/wallet'

/** 배지 톤 — up: 사용 가능 증가, dn: 감소, hold: 보류/해제(총 보유는 그대로) */
export type LedgerTone = 'up' | 'dn' | 'hold'

/**
 * `transaction_type` → 한글 배지 라벨.
 * 스키마에 CHECK 제약이 없어 값 목록이 미확정이다 (docs/04 §6.1) — **BE 확인 필요**.
 * 모르는 값이 오면 '기타'로 떨어뜨려 화면이 깨지지 않게 한다.
 */
const KIND_LABEL: Record<LedgerTransactionType, string> = {
  CHARGE: '충전',
  WITHDRAW: '출금',
  BID_HOLD: '보류',
  BID_HOLD_RELEASE: '해제',
  BID_HOLD_PARTIAL_RELEASE: '복구',
  DEAL_PAYMENT: '결제',
  DEAL_SETTLEMENT: '정산',
  SIGNUP_REWARD: '지급',
  ATTENDANCE_REWARD: '지급',
  WATCH_REWARD: '지급',
  PREDICTION_HOLD: '보류',
  PREDICTION_PAYOUT: '배당',
  PREDICTION_LOSS: '소멸',
}

export function ledgerKindLabel(entry: LedgerEntry): string {
  return KIND_LABEL[entry.transactionType] ?? '기타'
}

/**
 * 총 보유(= available + held) 증감.
 * 보류/해제 행은 두 델타의 합이 0이라 이 값이 0이 된다 — 금액 대신 라벨로 표기해야 하는 케이스다.
 */
export function ledgerNetDelta(entry: LedgerEntry): number {
  return entry.availableDelta + entry.heldDelta
}

/** 총 보유가 변하지 않는 행(보류 ↔ 해제 이동)인지 */
export function isHoldTransfer(entry: LedgerEntry): boolean {
  return ledgerNetDelta(entry) === 0
}

export function ledgerTone(entry: LedgerEntry): LedgerTone {
  const net = ledgerNetDelta(entry)
  if (net === 0) return 'hold'
  return net > 0 ? 'up' : 'dn'
}

/**
 * 보류 이동 행의 금액 문구용 부가 설명.
 * `held_delta`가 +면 사용 가능 → 보류, −면 보류 → 사용 가능.
 */
export function holdDirectionLabel(entry: LedgerEntry): string {
  return entry.heldDelta > 0 ? '사용 가능 → 보류' : '보류 → 사용 가능'
}
