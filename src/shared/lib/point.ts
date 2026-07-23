// PNT 포인트 표기 유틸 — 금액은 항상 천 단위 구분 + tabular numbers(`tabular-nums`)로 렌더한다.
import type { WalletType } from '@/mocks/wallet'

/** 지갑별 단위 표기 — 거래 포인트는 `P`, 베팅 포인트는 `BP` (디자인 단일 소스 기준) */
export const POINT_UNIT: Record<WalletType, string> = {
  TRADE: 'P',
  BETTING: 'BP',
}

/** 1234567 → "1,234,567" */
export function formatAmount(value: number): string {
  return Math.abs(value).toLocaleString('ko-KR')
}

/** 1234567, 'TRADE' → "1,234,567P" */
export function formatPoint(value: number, walletType: WalletType = 'TRADE'): string {
  return `${formatAmount(value)}${POINT_UNIT[walletType]}`
}

/** 부호를 붙인 표기 — 12000 → "+12,000P", -3000 → "−3,000P" (U+2212 마이너스) */
export function formatSignedPoint(value: number, walletType: WalletType = 'TRADE'): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatPoint(value, walletType)}`
}

/** 원장 시각 라벨 — 오늘/어제는 시각까지, 그 이전은 날짜로 */
export function formatLedgerTime(epochMs: number, now: number = Date.now()): string {
  const date = new Date(epochMs)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const dayDiff = Math.floor((startOfToday.getTime() - date.getTime()) / 86_400_000) + 1
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (epochMs >= startOfToday.getTime()) return `오늘 ${hhmm}`
  if (dayDiff === 1) return `어제 ${hhmm}`
  if (dayDiff < 7) return `${dayDiff}일 전`
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
