<script setup lang="ts">
// MEM 약관 동의 단계 (온보딩 1/2)
// 스키마 근거: terms(is_required, version, is_active, effective_at) + member_terms_agreement(UNIQUE(member_id, terms_id))
//  - is_required = TRUE인 약관은 전부 동의해야 다음 단계로 넘어간다.
//  - is_required = FALSE인 약관은 건너뛸 수 있고, 끄고 진행해도 된다.
//  - 버전이 있으므로 각 행에 v{version}을 표시하고, 전문은 모달로 본다.
import { computed, ref } from 'vue'
import type { Terms } from '@/mocks/terms'
import TermsDetailModal from './TermsDetailModal.vue'

const props = defineProps<{
  terms: Terms[]
  /** 이미 동의한 약관 id (재동의 화면에서 기존 상태를 채워 준다) */
  agreedIds?: number[]
}>()

const emit = defineEmits<{ submit: [checked: Record<number, boolean>] }>()

const checked = ref<Record<number, boolean>>(
  Object.fromEntries(props.terms.map((t) => [t.id, props.agreedIds?.includes(t.id) ?? false])),
)

const requiredTerms = computed(() => props.terms.filter((t) => t.isRequired))
const optionalTerms = computed(() => props.terms.filter((t) => !t.isRequired))

/** 필수 약관을 전부 켜야 다음 단계로 갈 수 있다 */
const canProceed = computed(() => requiredTerms.value.every((t) => checked.value[t.id]))
const allChecked = computed(() => props.terms.every((t) => checked.value[t.id]))

function toggleAll() {
  const next = !allChecked.value
  for (const t of props.terms) checked.value[t.id] = next
}

function toggle(id: number) {
  checked.value[id] = !checked.value[id]
}

const detail = ref<Terms | null>(null)
</script>

<template>
  <div class="text-left">
    <h1 class="text-ink text-[26px] font-bold tracking-tight">약관에 동의해 주세요</h1>
    <p class="text-dim mt-1.5 text-[13px] leading-relaxed">
      필수 약관에 동의해야 서비스를 이용할 수 있어요. 선택 항목은 나중에 마이페이지에서 바꿀 수
      있습니다.
    </p>

    <!-- 전체 동의 -->
    <div class="mt-6">
      <button
        type="button"
        class="border-line flex w-full items-center gap-2.5 border-b pb-3.5 text-left"
        :aria-pressed="allChecked"
        @click="toggleAll"
      >
        <span
          class="flex h-5 w-5 flex-none items-center justify-center rounded-md border-[1.5px] text-xs transition"
          :class="
            allChecked ? 'bg-terra border-terra text-on-dark' : 'border-faint text-transparent'
          "
          aria-hidden="true"
          >✓</span
        >
        <span class="text-ink text-sm font-semibold">약관에 모두 동의합니다</span>
      </button>

      <!-- 필수 → 선택 순서 -->
      <div
        v-for="t in [...requiredTerms, ...optionalTerms]"
        :key="t.id"
        class="border-line/60 flex items-start gap-2.5 border-b py-3 last:border-b-0"
      >
        <button
          type="button"
          class="flex flex-1 items-start gap-2.5 text-left"
          :aria-pressed="!!checked[t.id]"
          @click="toggle(t.id)"
        >
          <span
            class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border-[1.5px] text-xs transition"
            :class="
              checked[t.id] ? 'bg-terra border-terra text-on-dark' : 'border-faint text-transparent'
            "
            aria-hidden="true"
            >✓</span
          >
          <span class="min-w-0">
            <span class="text-ink block text-[13px] leading-snug">
              {{ t.title }}
              <span class="text-faint ml-1 text-[11px] tabular-nums">v{{ t.version }}</span>
            </span>
            <span v-if="t.summary" class="text-faint mt-0.5 block text-[11.5px]">
              {{ t.summary }}
            </span>
          </span>
        </button>
        <button
          type="button"
          class="text-dim hover:text-ink mt-0.5 flex-none text-[11.5px] underline transition"
          @click="detail = t"
        >
          보기
        </button>
      </div>
    </div>

    <p v-if="!canProceed" class="text-faint mt-4 text-[11.5px]">
      필수 약관 {{ requiredTerms.length }}건에 모두 동의해야 다음으로 넘어갈 수 있어요.
    </p>

    <button
      type="button"
      class="bg-terra text-on-dark hover:bg-terra-d mt-5 min-h-12 w-full rounded-xl text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
      :disabled="!canProceed"
      @click="emit('submit', { ...checked })"
    >
      동의하고 계속하기
    </button>

    <TermsDetailModal v-if="detail" :terms="detail" @close="detail = null" />
  </div>
</template>
