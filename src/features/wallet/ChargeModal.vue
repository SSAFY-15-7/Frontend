<script setup lang="ts">
// PNT-03 거래 포인트 충전 (FE1) — 디자인 `data-screen="charge"`를 모달로 옮긴 것.
// 베팅 포인트는 무료 재화라 충전 대상이 아니다(사행성 차단) — 거래 지갑에서만 열린다.
import { computed, ref } from 'vue'
import { formatAmount, formatPoint } from '@/shared/lib/point'

const props = defineProps<{
  /** 거래 지갑의 사용 가능 잔액 (`wallet.available_balance`) */
  available: number
  /** 보류 중 잔액 (`wallet.held_balance`) — 충전과 무관하지만 총 보유 안내에 쓴다 */
  held: number
}>()

const emit = defineEmits<{
  close: []
  submit: [amount: number]
}>()

const PRESETS = [
  { amount: 10_000, label: '1만' },
  { amount: 50_000, label: '5만' },
  { amount: 100_000, label: '10만' },
]

// `point_charge.payment_provider` — 값 목록은 스키마에 없다(BE 확인 필요)
const PROVIDERS = [
  { code: 'KAKAO', label: '카카오페이' },
  { code: 'CARD', label: '신용·체크카드' },
]

const rawAmount = ref('50,000')
const provider = ref('KAKAO')

const amount = computed(() => Number(rawAmount.value.replace(/[^\d]/g, '')) || 0)

// `charge_point_amount`와 `payment_amount`는 별도 컬럼이다 — 프로모션이 붙으면 달라질 수 있어 따로 표시한다.
// TODO: 실제 보너스 정책은 서버가 계산해 내려준다 (BE 확인 필요)
const paymentAmount = computed(() => amount.value)

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value.replace(/[^\d]/g, '')) || 0
  rawAmount.value = value > 0 ? formatAmount(value) : ''
}

function pickPreset(value: number) {
  rawAmount.value = formatAmount(value)
}

function submit() {
  if (amount.value <= 0) return
  emit('submit', amount.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="charge-title"
    @click.self="emit('close')"
  >
    <div
      class="border-line bg-surface max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border"
    >
      <div class="p-6 sm:p-7">
        <h2 id="charge-title" class="text-ink text-[24px] font-bold tracking-tight">
          거래 포인트 충전
        </h2>
        <p class="text-dim mt-1.5 text-[13px]">입찰과 낙찰 결제에 쓰이는 포인트예요.</p>

        <!-- 현재 잔액 — 사용 가능 / 보류를 따로 보여준다 (available_balance는 이미 보류 제외 값) -->
        <div class="border-line mt-5 rounded-xl border p-4">
          <div class="flex items-center justify-between">
            <span class="text-dim text-[12.5px]">사용 가능</span>
            <span class="text-ink text-[22px] font-bold tabular-nums">{{
              formatPoint(props.available)
            }}</span>
          </div>
          <div class="border-line mt-2.5 flex items-center justify-between border-t pt-2.5">
            <span class="text-faint text-[12px]">보류 중</span>
            <span class="text-dim text-[13px] font-semibold tabular-nums">{{
              formatPoint(props.held)
            }}</span>
          </div>
        </div>

        <!-- 충전 금액 -->
        <div class="mt-6">
          <div class="text-ink text-[13px] font-semibold">충전 금액</div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button
              v-for="preset in PRESETS"
              :key="preset.amount"
              type="button"
              class="rounded-xl border py-3.5 text-center text-[14px] font-semibold tabular-nums transition"
              :class="
                amount === preset.amount
                  ? 'bg-terra-tint border-terra text-terra-tint-text'
                  : 'border-line text-ink hover:bg-cream bg-surface'
              "
              @click="pickPreset(preset.amount)"
            >
              {{ preset.label }}
            </button>
          </div>
          <label
            class="border-line focus-within:border-slate bg-surface mt-2 flex items-baseline gap-2.5 rounded-xl border px-3 py-2.5 transition"
          >
            <span class="text-dim flex-none self-center text-[11.5px]">직접 입력</span>
            <input
              :value="rawAmount"
              class="text-ink w-full min-w-0 border-0 bg-transparent text-right text-[17px] font-semibold tabular-nums outline-none"
              inputmode="numeric"
              aria-label="충전 금액"
              @input="onInput"
            />
            <span class="text-dim flex-none text-[12px] font-semibold">P</span>
          </label>
        </div>

        <!-- 결제 수단 (`point_charge.payment_provider`) -->
        <div class="mt-6">
          <div class="text-ink mb-2.5 text-[13px] font-semibold">결제 수단</div>
          <div class="flex flex-col gap-2">
            <button
              v-for="item in PROVIDERS"
              :key="item.code"
              type="button"
              class="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition"
              :class="
                provider === item.code
                  ? 'bg-terra-tint border-terra'
                  : 'border-line hover:bg-cream bg-surface'
              "
              @click="provider = item.code"
            >
              <span
                class="h-3.5 w-3.5 flex-none rounded-full border-[4.5px] transition"
                :class="provider === item.code ? 'border-terra' : 'border-line'"
                aria-hidden="true"
              />
              <span class="text-ink flex-1 text-[13.5px]">{{ item.label }}</span>
              <span class="text-faint text-[11px]">테스트 결제</span>
            </button>
          </div>
        </div>

        <!-- 충전 포인트 ≠ 결제 금액일 수 있어(프로모션) 두 값을 각각 표시한다 -->
        <div class="border-line mt-5 rounded-xl border border-dashed px-4 py-3">
          <div class="flex items-center justify-between text-[12.5px]">
            <span class="text-dim">받는 포인트</span>
            <span class="text-ink font-semibold tabular-nums">{{ formatPoint(amount) }}</span>
          </div>
          <div class="mt-1.5 flex items-center justify-between text-[12.5px]">
            <span class="text-dim">결제 금액</span>
            <span class="text-ink font-semibold tabular-nums"
              >{{ formatAmount(paymentAmount) }}원</span
            >
          </div>
          <p class="text-faint mt-2.5 text-[11.5px] leading-relaxed">
            PG 샌드박스(테스트 키)로 동작해 실제 결제가 발생하지 않아요. 보류 중인 포인트를 제외하면
            언제든 출금할 수 있어요.
          </p>
        </div>

        <div class="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            class="border-line text-dim hover:bg-cream bg-surface rounded-xl border px-5 py-3 text-[14px] font-medium transition"
            @click="emit('close')"
          >
            취소
          </button>
          <button
            type="button"
            class="bg-terra text-on-dark hover:bg-terra-d flex-1 rounded-xl px-4 py-3 text-[15px] font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="amount <= 0"
            @click="submit"
          >
            {{ amount > 0 ? `${formatPoint(amount)} 충전하기` : '금액을 입력하세요' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
