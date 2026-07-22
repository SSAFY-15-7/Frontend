<script setup lang="ts">
// PNT-01·02 이중 지갑 + 원장 (FE1)
//
// 스키마 제약이 화면에 그대로 반영돼 있다 (docs/04-백엔드-스키마-메모.md §3.5):
// - 지갑은 회원당 TRADE / BETTING 2행이고 상호 전환 개념이 없다 → 카드 2장, 이체 UI 없음.
// - `available_balance`는 이미 보류를 제외한 값 → "사용 가능 / 보류 중 / 총 보유"를 각각 표시한다.
//   총 보유 = available + held. 여기서 보류를 다시 빼면 이중 차감이다.
// - 원장은 `trade_point_ledger`/`betting_point_ledger` 두 테이블로 분리 → 병합하지 않고 탭으로 나눈다.
// - 홀드 행은 두 델타의 합이 0이라 "증감 0"으로 보인다 → 금액 대신 "보류/해제" 라벨과 이동 방향으로 렌더.
// - 원장은 append-only다 → 수정·삭제 UI를 두지 않는다.
import { computed, onMounted, ref, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import type { LedgerEntry, WalletType } from '@/stores/wallet'
import { formatLedgerTime, formatPoint, formatSignedPoint } from '@/shared/lib/point'
import {
  holdDirectionLabel,
  isHoldTransfer,
  ledgerKindLabel,
  ledgerNetDelta,
  ledgerTone,
  type LedgerTone,
} from './ledgerLabel'
import ChargeModal from './ChargeModal.vue'
import WithdrawModal from './WithdrawModal.vue'

const wallet = useWalletStore()

onMounted(() => {
  wallet.loadWallet()
})

const WALLET_TABS: { type: WalletType; label: string }[] = [
  { type: 'TRADE', label: '거래 포인트' },
  { type: 'BETTING', label: '베팅 포인트' },
]

const LEDGER_PAGE = 8
const shown = ref(LEDGER_PAGE)

// 지갑을 바꾸면 원장도 처음부터 다시 (두 테이블이 분리돼 있어 페이지 커서를 공유하지 않는다)
watch(
  () => wallet.activeWalletType,
  () => {
    shown.value = LEDGER_PAGE
  },
)

const visibleLedger = computed(() => wallet.activeLedger.slice(0, shown.value))
const hasMore = computed(() => shown.value < wallet.activeLedger.length)

const ledgerSub = computed(() =>
  wallet.activeWalletType === 'TRADE'
    ? '입찰 보류부터 낙찰 차감까지 전부 남아요'
    : '충전할 수 없는 무료 재화예요 — 가입·출석·적중으로만 받아요',
)

const TONE_BADGE: Record<LedgerTone, string> = {
  up: 'bg-success-tint text-success',
  dn: 'bg-terra-tint text-terra-tint-text',
  hold: 'bg-slate-tint text-slate',
}
const TONE_AMOUNT: Record<LedgerTone, string> = {
  up: 'text-success',
  dn: 'text-terra-d',
  hold: 'text-slate',
}

/** 원장 행의 금액 문구 — 보류 이동 행은 총 증감이 0이라 이동한 보류 금액을 부호 없이 보여준다 */
function amountText(entry: LedgerEntry): string {
  if (isHoldTransfer(entry)) return formatPoint(Math.abs(entry.heldDelta), entry.walletType)
  return formatSignedPoint(ledgerNetDelta(entry), entry.walletType)
}

const chargeOpen = ref(false)
const withdrawOpen = ref(false)
const toast = ref('')

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => {
    if (toast.value === message) toast.value = ''
  }, 2400)
}

function onCharge(amount: number) {
  wallet.chargeTradePoint(amount)
  chargeOpen.value = false
  wallet.setActiveWalletType('TRADE')
  showToast(`${formatPoint(amount)} 충전 완료 · 테스트 결제`)
}

function onWithdraw(amount: number) {
  const failure = wallet.withdrawTradePoint(amount)
  if (failure) {
    showToast(failure)
    return
  }
  withdrawOpen.value = false
  wallet.setActiveWalletType('TRADE')
  showToast(`${formatPoint(amount)} 출금 신청 완료 · 테스트 송금`)
}
</script>

<template>
  <main class="bg-cream min-h-screen">
    <div class="mx-auto max-w-3xl px-6 py-10">
      <header>
        <h1 class="text-ink text-[30px] font-bold tracking-tight">지갑 · 원장</h1>
        <p class="text-dim mt-1.5 text-[13px]">
          거래 포인트와 베팅 포인트는 별개 지갑이에요 — 서로 옮길 수 없어요.
        </p>
      </header>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- 거래 지갑 (TRADE) — 충전·출금 대상 -->
        <section
          class="bg-terra-tint border-terra/25 rounded-2xl border p-5"
          :class="wallet.activeWalletType === 'TRADE' ? 'ring-terra ring-2' : ''"
          aria-labelledby="trade-wallet-label"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              id="trade-wallet-label"
              class="bg-terra text-on-dark rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
              >거래 포인트</span
            >
            <div class="flex flex-none gap-1.5">
              <button
                type="button"
                class="border-line text-dim bg-surface rounded-full border px-3 py-1 text-[11.5px] font-medium transition hover:bg-white/70"
                @click="withdrawOpen = true"
              >
                출금
              </button>
              <button
                type="button"
                class="bg-terra text-on-dark hover:bg-terra-d rounded-full px-3 py-1 text-[11.5px] font-semibold transition"
                @click="chargeOpen = true"
              >
                충전
              </button>
            </div>
          </div>

          <div class="text-terra-d mt-3 text-[32px] leading-none font-bold tabular-nums">
            {{ formatPoint(wallet.tradeWallet.availableBalance) }}
          </div>
          <div class="text-terra mt-1.5 text-[11.5px]">사용 가능 · 보류를 제외한 금액</div>

          <dl class="border-terra/20 mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-[12px]">
            <div>
              <dt class="text-dim">보류 중</dt>
              <dd class="text-ink mt-0.5 font-semibold tabular-nums">
                {{ formatPoint(wallet.tradeWallet.heldBalance) }}
              </dd>
            </div>
            <div class="text-right">
              <dt class="text-dim">총 보유</dt>
              <dd class="text-ink mt-0.5 font-semibold tabular-nums">
                {{ formatPoint(wallet.tradeTotal) }}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            class="border-terra/20 text-terra-d mt-3 flex w-full items-center justify-between border-t pt-3 text-[12px] font-semibold"
            @click="wallet.setActiveWalletType('TRADE')"
          >
            <span>거래 내역 보기</span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <!-- 베팅 지갑 (BETTING) — 무료 재화라 충전·출금·전환이 없다 -->
        <section
          class="bg-slate-tint border-slate/40 rounded-2xl border p-5"
          :class="wallet.activeWalletType === 'BETTING' ? 'ring-slate ring-2' : ''"
          aria-labelledby="betting-wallet-label"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              id="betting-wallet-label"
              class="bg-slate text-on-dark rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
              >베팅 포인트</span
            >
            <span class="text-slate text-[11px]">무료 재화 · 전환 불가</span>
          </div>

          <div class="text-slate mt-3 text-[32px] leading-none font-bold tabular-nums">
            {{ formatPoint(wallet.bettingWallet.availableBalance, 'BETTING') }}
          </div>
          <div class="text-slate mt-1.5 text-[11.5px]">사용 가능 · 보류를 제외한 금액</div>

          <dl class="border-slate/25 mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-[12px]">
            <div>
              <dt class="text-dim">보류 중</dt>
              <dd class="text-ink mt-0.5 font-semibold tabular-nums">
                {{ formatPoint(wallet.bettingWallet.heldBalance, 'BETTING') }}
              </dd>
            </div>
            <div class="text-right">
              <dt class="text-dim">총 보유</dt>
              <dd class="text-ink mt-0.5 font-semibold tabular-nums">
                {{ formatPoint(wallet.bettingTotal, 'BETTING') }}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            class="border-slate/25 text-slate mt-3 flex w-full items-center justify-between border-t pt-3 text-[12px] font-semibold"
            @click="wallet.setActiveWalletType('BETTING')"
          >
            <span>베팅 내역 보기</span>
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>

      <!-- 원장 (PNT-02) -->
      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-ink text-[20px] font-bold tracking-tight">포인트 내역</h2>
            <p class="text-dim mt-1 text-[12.5px]">{{ ledgerSub }}</p>
          </div>
          <div class="bg-line inline-flex gap-1 rounded-xl p-1">
            <button
              v-for="tab in WALLET_TABS"
              :key="tab.type"
              type="button"
              class="rounded-lg px-4 py-2 text-[13px] transition"
              :class="
                wallet.activeWalletType === tab.type
                  ? 'text-ink bg-surface font-semibold shadow-sm'
                  : 'text-dim hover:text-ink'
              "
              @click="wallet.setActiveWalletType(tab.type)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <ul v-if="visibleLedger.length > 0" class="border-line bg-surface mt-4 rounded-2xl border">
          <li
            v-for="entry in visibleLedger"
            :key="entry.id"
            class="border-line flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0"
          >
            <span
              class="flex-none rounded-full px-2.5 py-1 text-[11px] font-bold"
              :class="TONE_BADGE[ledgerTone(entry)]"
            >
              {{ ledgerKindLabel(entry) }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="text-ink truncate text-[13px] leading-snug">{{ entry.description }}</div>
              <div class="text-faint mt-0.5 text-[11.5px] tabular-nums">
                {{ formatLedgerTime(entry.createdAt) }} · 잔액
                {{ formatPoint(entry.availableBalanceAfter, entry.walletType) }} / 보류
                {{ formatPoint(entry.heldBalanceAfter, entry.walletType) }}
              </div>
            </div>
            <div class="flex-none text-right">
              <div
                class="text-[14px] font-bold tabular-nums"
                :class="TONE_AMOUNT[ledgerTone(entry)]"
              >
                {{ amountText(entry) }}
              </div>
              <!-- 총 보유가 그대로인 행은 금액만 보면 "증감 0"처럼 보인다 — 이동 방향을 함께 적는다 -->
              <div v-if="isHoldTransfer(entry)" class="text-faint mt-0.5 text-[11px]">
                {{ holdDirectionLabel(entry) }}
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="text-faint py-14 text-center text-[13px]">아직 포인트 내역이 없어요</p>

        <div v-if="visibleLedger.length > 0" class="mt-4 text-center">
          <button
            v-if="hasMore"
            type="button"
            class="border-line text-dim hover:bg-cream bg-surface rounded-full border px-5 py-2.5 text-[13px] font-medium transition"
            @click="shown += LEDGER_PAGE"
          >
            더 보기
          </button>
          <p v-else class="text-faint text-[12.5px]">더 이상 내역이 없어요</p>
        </div>
      </section>
    </div>

    <ChargeModal
      v-if="chargeOpen"
      :available="wallet.tradeWallet.availableBalance"
      :held="wallet.tradeWallet.heldBalance"
      @close="chargeOpen = false"
      @submit="onCharge"
    />
    <WithdrawModal
      v-if="withdrawOpen"
      :available="wallet.tradeWallet.availableBalance"
      :held="wallet.tradeWallet.heldBalance"
      @close="withdrawOpen = false"
      @submit="onWithdraw"
    />

    <div
      v-if="toast"
      class="bg-stage text-on-dark fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-[13px] font-medium shadow-lg"
      role="status"
    >
      {{ toast }}
    </div>
  </main>
</template>
