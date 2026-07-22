<script setup lang="ts">
// ROOM-01 방 개설 2단계 폼 (FE1) — 1단계 상품 정보 → 2단계 경매 조건
// 스키마 근거는 docs/04-백엔드-스키마-메모.md §3.4. 검증은 DB CHECK 제약을 그대로 옮긴 것이다.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockCategories } from '@/mocks/categories'
import {
  useRoomStore,
  type ConditionStatus,
  type CreateRoomPayload,
  type ProductImageDraft,
  type StartType,
} from '@/stores/room'
import RoomCreateStep1 from './RoomCreateStep1.vue'
import RoomCreateStep2 from './RoomCreateStep2.vue'

const router = useRouter()
const roomStore = useRoomStore()

const TITLE_MAX = 100

const step = ref<1 | 2>(1)
const step1Attempted = ref(false)
const step2Attempted = ref(false)
const submitError = ref('')

// ── 1단계: 상품 정보 (product · product_image) ──
const title = ref('')
const description = ref('')
const categoryCode = ref('')
const conditionStatus = ref<ConditionStatus | ''>('')
const images = ref<ProductImageDraft[]>([])

// ── 2단계: 경매 조건 (auction_room) ──
const reservePrice = ref<number | null>(null)
const durationMinutes = ref<number | null>(10)
const startType = ref<StartType>('IMMEDIATE')
const scheduledDate = ref('')
const scheduledTime = ref('')

// SCHEDULED일 때만 값을 만든다. IMMEDIATE면 항상 null (ck_auction_room_schedule)
const scheduledAt = computed<Date | null>(() => {
  if (startType.value !== 'SCHEDULED') return null
  if (!scheduledDate.value || !scheduledTime.value) return null
  const parsed = new Date(`${scheduledDate.value}T${scheduledTime.value}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
})

const step1Errors = computed(() => {
  const errors: Partial<Record<'title' | 'description' | 'categoryCode', string>> = {}
  const trimmedTitle = title.value.trim()
  if (trimmedTitle.length === 0) errors.title = '제목을 입력해 주세요.'
  else if (trimmedTitle.length > TITLE_MAX)
    errors.title = `제목은 ${TITLE_MAX}자 이내로 입력해 주세요.`
  // product.description은 NOT NULL — 공백만 입력하는 것도 막는다
  if (description.value.trim().length === 0) errors.description = '상품 설명을 입력해 주세요.'
  if (categoryCode.value === '') errors.categoryCode = '카테고리를 선택해 주세요.'
  return errors
})

const step2Errors = computed(() => {
  const errors: Partial<Record<'reservePrice' | 'durationMinutes' | 'scheduledAt', string>> = {}
  // reserve_price > 0
  if (reservePrice.value === null || Number.isNaN(reservePrice.value)) {
    errors.reservePrice = '하한가를 입력해 주세요.'
  } else if (!Number.isInteger(reservePrice.value)) {
    errors.reservePrice = '하한가는 1P 단위 정수로 입력해 주세요.'
  } else if (reservePrice.value <= 0) {
    errors.reservePrice = '하한가는 1P 이상이어야 해요.'
  }
  // duration_minutes > 0
  if (durationMinutes.value === null || Number.isNaN(durationMinutes.value)) {
    errors.durationMinutes = '진행 시간을 입력해 주세요.'
  } else if (!Number.isInteger(durationMinutes.value)) {
    errors.durationMinutes = '진행 시간은 분 단위 정수로 입력해 주세요.'
  } else if (durationMinutes.value <= 0) {
    errors.durationMinutes = '진행 시간은 1분 이상이어야 해요.'
  }
  // SCHEDULED면 scheduled_at NOT NULL
  if (startType.value === 'SCHEDULED') {
    if (!scheduledDate.value || !scheduledTime.value) {
      errors.scheduledAt = '예약 시작은 날짜와 시각을 모두 입력해야 해요.'
    } else if (scheduledAt.value === null) {
      errors.scheduledAt = '시작 예정 시각을 올바르게 입력해 주세요.'
    } else if (scheduledAt.value.getTime() <= Date.now()) {
      errors.scheduledAt = '시작 예정 시각은 현재보다 뒤여야 해요.'
    }
  }
  return errors
})

const step1Valid = computed(() => Object.keys(step1Errors.value).length === 0)
const step2Valid = computed(() => Object.keys(step2Errors.value).length === 0)
const canSubmit = computed(() => step1Valid.value && step2Valid.value && !roomStore.creating)

// 시도하기 전에는 에러를 띄우지 않는다 (빈 폼이 빨갛게 열리는 것 방지)
const shownStep1Errors = computed(() => (step1Attempted.value ? step1Errors.value : {}))
const shownStep2Errors = computed(() => (step2Attempted.value ? step2Errors.value : {}))

function goStep2() {
  step1Attempted.value = true
  if (!step1Valid.value) return
  step.value = 2
}

function goStep1() {
  step.value = 1
}

async function submit() {
  step1Attempted.value = true
  step2Attempted.value = true
  submitError.value = ''
  if (!step1Valid.value) {
    step.value = 1
    return
  }
  if (!step2Valid.value || roomStore.creating) return

  const payload: CreateRoomPayload = {
    product: {
      title: title.value.trim(),
      description: description.value.trim(),
      categoryCode: categoryCode.value,
      conditionStatus: conditionStatus.value === '' ? null : conditionStatus.value,
      images: images.value,
    },
    room: {
      reservePrice: reservePrice.value as number,
      durationMinutes: durationMinutes.value as number,
      startType: startType.value,
      scheduledAt: scheduledAt.value ? scheduledAt.value.toISOString() : null,
    },
  }

  try {
    const result = await roomStore.createRoom(payload)
    // 즉시 시작이면 라이브, 예약이면 대기방으로 (ROOM-07)
    await router.push(
      result.startType === 'IMMEDIATE'
        ? `/rooms/${result.roomId}/live`
        : `/rooms/${result.roomId}/waiting`,
    )
  } catch {
    submitError.value = '방 개설에 실패했어요. 잠시 후 다시 시도해 주세요.'
  }
}
</script>

<template>
  <main class="bg-cream min-h-screen">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <h1 class="text-ink text-[30px] font-bold tracking-tight">경매 방 개설</h1>

      <!-- 단계 표시 -->
      <ol class="mt-4.5 mb-6 flex items-center gap-2.5">
        <li class="flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold"
            :class="step === 1 ? 'bg-terra text-on-dark' : 'bg-line text-faint'"
          >
            {{ step === 1 ? '1' : '✓' }}
          </span>
          <span class="text-[14px]" :class="step === 1 ? 'text-ink font-semibold' : 'text-faint'">
            상품 정보
          </span>
        </li>
        <li class="bg-line h-px w-10" aria-hidden="true" />
        <li class="flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold"
            :class="step === 2 ? 'bg-terra text-on-dark' : 'bg-line text-faint'"
          >
            2
          </span>
          <span class="text-[14px]" :class="step === 2 ? 'text-ink font-semibold' : 'text-faint'">
            경매 조건
          </span>
        </li>
      </ol>

      <RoomCreateStep1
        v-show="step === 1"
        v-model:title="title"
        v-model:description="description"
        v-model:category-code="categoryCode"
        v-model:condition-status="conditionStatus"
        v-model:images="images"
        :categories="mockCategories"
        :errors="shownStep1Errors"
      />

      <RoomCreateStep2
        v-if="step === 2"
        v-model:reserve-price="reservePrice"
        v-model:duration-minutes="durationMinutes"
        v-model:start-type="startType"
        v-model:scheduled-date="scheduledDate"
        v-model:scheduled-time="scheduledTime"
        :errors="shownStep2Errors"
      />

      <p v-if="submitError" class="text-red mt-4 text-[13px]">{{ submitError }}</p>

      <!-- 단계 이동 · 제출 -->
      <div class="mt-6 flex items-center gap-2.5">
        <template v-if="step === 1">
          <RouterLink
            to="/"
            class="border-line text-dim hover:bg-cream rounded-full border bg-white px-5.5 py-3 text-[14px] font-medium transition"
          >
            취소
          </RouterLink>
          <div class="flex-1" />
          <button
            type="button"
            class="bg-terra text-on-dark hover:bg-terra-d rounded-full px-6.5 py-3 text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="step1Attempted && !step1Valid"
            @click="goStep2"
          >
            다음 · 경매 조건 →
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="border-line text-dim hover:bg-cream rounded-full border bg-white px-5.5 py-3 text-[14px] font-medium transition"
            @click="goStep1"
          >
            ← 이전
          </button>
          <div class="flex-1" />
          <button
            type="button"
            class="bg-terra text-on-dark hover:bg-terra-d rounded-full px-6.5 py-3 text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{
              roomStore.creating
                ? '개설 중…'
                : startType === 'IMMEDIATE'
                  ? '방송 시작하기'
                  : '대기방 열기'
            }}
          </button>
        </template>
      </div>
    </div>
  </main>
</template>
