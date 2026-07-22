import { defineStore } from 'pinia'
import {
  mockBettingLedger,
  mockTradeLedger,
  mockWallets,
  type LedgerEntry,
  type Wallet,
  type WalletType,
} from '@/mocks/wallet'

export type { LedgerEntry, Wallet, WalletType }

// 오너: FE1 (PNT-01~02) — 거래/베팅 이중 지갑. 두 지갑은 별개 행이고 상호 전환 개념이 없다.
//
// 스키마 정렬 (docs/04-백엔드-스키마-메모.md §3.5 · §4.2)
// - `wallet.available_balance`는 **이미 보류를 제외한 값**이다.
//   과거 구현의 `tradeAvailable = tradePoint - tradeHold` getter는 보류를 한 번 더 빼는
//   **이중 차감 버그**였다 — 제거하고, 스키마 컬럼(available/held)을 그대로 들고 있는 구조로 바꿨다.
//   총 보유가 필요하면 반대로 `available + held`를 더한다(`tradeTotal`·`bettingTotal`).
// - 베팅 지갑에도 `held_balance`가 있다(구 `betPoint` 단일 값은 보류 잔액이 누락돼 있었다).

interface WalletState {
  /** `wallet` 행 목록 — 회원당 TRADE 1행 + BETTING 1행 */
  wallets: Wallet[]
  /** `trade_point_ledger` — 최신순 */
  tradeLedger: LedgerEntry[]
  /** `betting_point_ledger` — 최신순 */
  bettingLedger: LedgerEntry[]
  /** 화면에서 보고 있는 지갑 (원장도 이 값을 따라간다) */
  activeWalletType: WalletType
  loaded: boolean
}

/** 지갑 행이 아직 없을 때 쓰는 0 잔액 (신규 회원·로딩 중) */
function emptyWallet(walletType: WalletType): Wallet {
  return { walletId: 0, walletType, availableBalance: 0, heldBalance: 0 }
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    wallets: [],
    tradeLedger: [],
    bettingLedger: [],
    activeWalletType: 'TRADE',
    loaded: false,
  }),
  getters: {
    /** 거래 지갑 — 충전·출금 대상 */
    tradeWallet: (state): Wallet =>
      state.wallets.find((w) => w.walletType === 'TRADE') ?? emptyWallet('TRADE'),
    /** 베팅 지갑 — 무료 재화라 충전·출금 대상이 아니다 */
    bettingWallet: (state): Wallet =>
      state.wallets.find((w) => w.walletType === 'BETTING') ?? emptyWallet('BETTING'),
    /** 총 보유 = 사용 가능 + 보류 (available_balance가 이미 보류 제외 값이므로 빼지 않고 더한다) */
    tradeTotal(): number {
      return this.tradeWallet.availableBalance + this.tradeWallet.heldBalance
    },
    bettingTotal(): number {
      return this.bettingWallet.availableBalance + this.bettingWallet.heldBalance
    },
    activeWallet(): Wallet {
      return this.activeWalletType === 'TRADE' ? this.tradeWallet : this.bettingWallet
    },
    activeTotal(): number {
      return this.activeWallet.availableBalance + this.activeWallet.heldBalance
    },
    /** 현재 지갑의 원장 — 두 테이블이 분리돼 있어 병합하지 않는다 (페이지네이션이 깨진다) */
    activeLedger(): LedgerEntry[] {
      return this.activeWalletType === 'TRADE' ? this.tradeLedger : this.bettingLedger
    },
  },
  actions: {
    // PNT-01 지갑 잔액 + PNT-02 원장 조회
    loadWallet() {
      // TODO: shared/api/http.ts 경유 실API로 교체 (GET /wallets, GET /wallets/{type}/ledger)
      this.wallets = mockWallets.map((w) => ({ ...w }))
      this.tradeLedger = mockTradeLedger.map((e) => ({ ...e }))
      this.bettingLedger = mockBettingLedger.map((e) => ({ ...e }))
      this.loaded = true
    },

    setActiveWalletType(walletType: WalletType) {
      this.activeWalletType = walletType
    },

    /**
     * PNT-03 포인트 충전 — 거래 지갑 전용.
     * 실제로는 `point_charge` 행 생성 → PG 결제 → 승인 콜백 순서이고, 원장 행은 승인 시점에 생긴다.
     * 목에서는 즉시 승인된 것으로 처리한다.
     */
    chargeTradePoint(amount: number) {
      // TODO: shared/api/http.ts 경유 실API로 교체 (POST /point-charges → PG 리다이렉트 → 승인 콜백)
      const wallet = this.wallets.find((w) => w.walletType === 'TRADE')
      if (!wallet || amount <= 0) return
      wallet.availableBalance += amount
      this.tradeLedger.unshift({
        id: Date.now(),
        walletType: 'TRADE',
        transactionType: 'CHARGE',
        availableDelta: amount,
        heldDelta: 0,
        availableBalanceAfter: wallet.availableBalance,
        heldBalanceAfter: wallet.heldBalance,
        createdAt: Date.now(),
        description: '포인트 충전 · 테스트 결제',
      })
    },

    /**
     * PNT-04 포인트 출금 — 거래 지갑 전용.
     * `available_balance >= 0` 제약이 있고 보류분은 출금 대상이 아니므로 사용 가능 잔액을 상한으로 검증한다.
     * 반환값은 실패 사유(성공이면 null).
     */
    withdrawTradePoint(amount: number): string | null {
      // TODO: shared/api/http.ts 경유 실API로 교체 (POST /wallets/TRADE/withdrawals)
      const wallet = this.wallets.find((w) => w.walletType === 'TRADE')
      if (!wallet) return '거래 지갑을 찾을 수 없어요'
      if (amount <= 0) return '출금 금액을 입력해 주세요'
      if (amount > wallet.availableBalance) return '사용 가능 잔액을 넘을 수 없어요'
      wallet.availableBalance -= amount
      this.tradeLedger.unshift({
        id: Date.now(),
        walletType: 'TRADE',
        transactionType: 'WITHDRAW',
        availableDelta: -amount,
        heldDelta: 0,
        availableBalanceAfter: wallet.availableBalance,
        heldBalanceAfter: wallet.heldBalance,
        createdAt: Date.now(),
        description: '등록 계좌로 출금 · 테스트 송금',
      })
      return null
    },
  },
})
