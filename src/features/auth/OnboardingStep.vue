<script setup lang="ts">
// MEM 프로필 만들기 단계 (온보딩 2/2)
// `member` 테이블에는 nickname / role / status / 타임스탬프뿐이다 —
// 이메일·프로필 이미지·실명 컬럼이 없으므로 그런 입력을 만들지 않는다 (docs/04 §3.6).
// nickname은 VARCHAR(30) UNIQUE nullable → 길이 30 제한 + 중복(409) 처리가 필요하다.
import { computed, ref } from 'vue'
import { NICKNAME_MAX_LENGTH } from '@/stores/auth'

const props = defineProps<{
  /** 스토어가 돌려준 제출 실패 사유 (닉네임 중복 등) */
  error?: string | null
  pending?: boolean
}>()

const emit = defineEmits<{ submit: [nickname: string]; back: [] }>()

const nickname = ref('')

// 이모지·서로게이트 페어를 1자로 세기 위해 스프레드로 센다
const length = computed(() => [...nickname.value.trim()].length)
const valid = computed(() => length.value > 0 && length.value <= NICKNAME_MAX_LENGTH)

function submit() {
  if (!valid.value || props.pending) return
  emit('submit', nickname.value.trim())
}
</script>

<template>
  <form class="text-left" @submit.prevent="submit">
    <h1 class="text-ink text-[26px] font-bold tracking-tight">프로필 만들기</h1>
    <p class="text-dim mt-1.5 text-[13px] leading-relaxed">
      카카오 계정에는 없는 정보예요. 처음 한 번만 입력하면 됩니다.
    </p>

    <div class="mt-6">
      <label for="onboarding-nickname" class="text-dim mb-1.5 block text-xs">닉네임</label>
      <div
        class="bg-surface flex items-baseline gap-2.5 rounded-[10px] border px-3 py-2.5 transition focus-within:ring-3"
        :class="
          error
            ? 'border-red focus-within:ring-red/12'
            : 'border-line focus-within:border-slate focus-within:ring-slate/12'
        "
      >
        <input
          id="onboarding-nickname"
          v-model="nickname"
          type="text"
          class="text-ink placeholder:text-faint min-w-0 flex-1 bg-transparent text-base outline-none"
          :maxlength="NICKNAME_MAX_LENGTH"
          placeholder="닉네임을 입력하세요"
          autocomplete="nickname"
        />
        <span class="text-dim flex-none text-xs font-semibold tabular-nums">
          {{ length }}/{{ NICKNAME_MAX_LENGTH }}
        </span>
      </div>
      <p v-if="error" class="text-red mt-1.5 text-[11.5px]">{{ error }}</p>
      <p class="text-faint mt-1.5 text-[11.5px] leading-relaxed">
        입찰·채팅에 표시돼요. 낙찰 결과에서는 다른 참여자에게 마스킹됩니다. 이미 쓰고 있는 닉네임은
        고를 수 없어요.
      </p>
    </div>

    <div class="mt-5.5 flex gap-2.5">
      <button
        type="button"
        class="border-line text-dim hover:bg-cream bg-surface min-h-12 flex-none rounded-xl border px-5 text-sm font-semibold transition"
        @click="emit('back')"
      >
        이전
      </button>
      <button
        type="submit"
        class="bg-terra text-on-dark hover:bg-terra-d min-h-12 flex-1 rounded-xl text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        :disabled="!valid || pending"
      >
        {{ pending ? '저장 중…' : 'BidLive 시작하기' }}
      </button>
    </div>
  </form>
</template>
