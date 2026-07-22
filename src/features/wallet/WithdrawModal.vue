<script setup lang="ts">
// PNT-04 거래 포인트 출금 (FE1) — 디자인 `data-screen="withdraw"`를 모달로 옮긴 것.
// `available_balance >= 0` 제약 + 보류분은 정산 전까지 출금 불가 → 사용 가능 잔액이 출금 상한이다.
import { computed, ref } from 'vue'
import { formatAmount, formatPoint } from '@/shared/lib/point'

const props = defineProps<{
  /** 출금 상한 = `wallet.available_balance` (보류 제외 값) */
  available: number
  /** `wallet.held_balance` — 출금 대상이 아님을 안내한다 */
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

// TODO: 등록 계좌는 스키마에 대응 테이블이 없다 — 출금 도메인 자체가 미정이라 목 문자열로 둔다 (BE 확인 필요)
const account = '국민은행 123456-78-901234 · 준호'

const rawAmount = ref('50,000')
const amount = computed(() => Number(rawAmount.value.replace(/[^\d]/g, '')) || 0)

const error = computed(() => {
  if (amount.value <= 0) return ''
  if (amount.value > props.available) return '사용 가능 잔액을 넘을 수 없어요'
  return ''
})

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value.replace(/[^\d]/g, '')) || 0
  rawAmount.value = value > 0 ? formatAmount(value) : ''
}

function pickPreset(value: number) {
  rawAmount.value = formatAmount(value)
}

function submit() {
  if (amount.value <= 0 || error.value) return
  emit('submit', amount.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="withdraw-title"
    @click.self="emit('close')"
  >
    <div
      class="border-line bg-surface max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border"
    >
      <div class="p-6 sm:p-7">
        <h2 id="withdraw-title" class="text-ink text-[24px] font-bold tracking-tight">
          거래 포인트 출금
        </h2>
        <p class="text-dim mt-1.5 text-[13px]">
          등록된 계좌로 보내요. 보류 중인 포인트는 정산 전까지 출금할 수 없어요.
        </p>

        <div class="border-line mt-5 rounded-xl border p-4">
          <div class="flex items-center justify-between">
            <span class="text-dim text-[12.5px]">출금 가능 금액</span>
            <span class="text-ink text-[22px] font-bold tabular-nums">{{
              formatPoint(props.available)
            }}</span>
          </div>
          <div class="border-line mt-2.5 flex items-center justify-between border-t pt-2.5">
            <span class="text-faint text-[12px]">보류 중 (출금 불가)</span>
            <span class="text-slate text-[13px] font-semibold tabular-nums">{{
              formatPoint(props.held)
            }}</span>
          </div>
        </div>

        <div class="mt-6">
          <div class="text-ink text-[13px] font-semibold">출금 금액</div>
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
            class="bg-surface mt-2 flex items-baseline gap-2.5 rounded-xl border px-3 py-2.5 transition"
            :class="error ? 'border-red' : 'border-line focus-within:border-slate'"
          >
            <span class="text-dim flex-none self-center text-[11.5px]">직접 입력</span>
            <input
              :value="rawAmount"
              class="text-ink w-full min-w-0 border-0 bg-transparent text-right text-[17px] font-semibold tabular-nums outline-none"
              inputmode="numeric"
              aria-label="출금 금액"
              @input="onInput"
            />
            <span class="text-dim flex-none text-[12px] font-semibold">P</span>
          </label>
          <p v-if="error" class="text-red mt-1.5 text-[12px]" role="alert">{{ error }}</p>
        </div>

        <div class="border-line mt-5 rounded-xl border px-4 py-3.5">
          <div class="text-faint text-[11px]">받을 계좌</div>
          <div class="text-ink mt-1 text-[13.5px] tabular-nums">{{ account }}</div>
        </div>

        <div class="border-line text-dim mt-4 rounded-xl border border-dashed px-4 py-3">
          <p class="text-[11.5px] leading-relaxed">
            영업일 기준 1~2일 내 입금돼요. 테스트 환경이라 실제 송금은 발생하지 않아요.
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
            :disabled="amount <= 0 || !!error"
            @click="submit"
          >
            {{ amount > 0 ? `${formatPoint(amount)} 출금 신청` : '금액을 입력하세요' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
