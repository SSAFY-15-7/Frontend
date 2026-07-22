<script setup lang="ts">
// MEM 온보딩 (FE1) — 카카오가 주지 않는 것(약관 동의·닉네임)만 최초 1회 받는다.
// 라우트를 별도로 둔 이유: `member.nickname`이 nullable이고 `terms`가 버전 관리되므로
// "온보딩 미완료" 상태가 로그인과 무관하게 다시 발생한다(약관 개정 → 재동의).
// /login 안의 단계로 두면 이미 로그인한 회원을 다시 데려올 자리가 없다 (docs/04 §5.1).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TermsAgreement from './TermsAgreement.vue'
import OnboardingStep from './OnboardingStep.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const STEPS = ['약관 동의', '프로필'] as const
const step = ref<0 | 1>(0)
const submitting = ref(false)

const redirectTo = computed(() => {
  const raw = route.query.redirect
  return typeof raw === 'string' && raw.startsWith('/') ? raw : '/'
})

const agreedIds = computed(() => auth.agreements.filter((a) => a.isAgreed).map((a) => a.termsId))

onMounted(() => {
  if (auth.terms.length === 0) auth.loadTerms()
  // 약관은 이미 다 동의했고 닉네임만 없는 경우(재로그인 등)는 프로필 단계에서 시작
  if (auth.isLoggedIn && auth.pendingRequiredTerms.length === 0) step.value = 1
})

function handleTerms(checked: Record<number, boolean>) {
  auth.agreeToTerms(checked)
  // 닉네임이 이미 있으면(약관 개정 재동의 케이스) 프로필 단계를 건너뛰고 끝낸다
  if (auth.user?.nickname) {
    router.replace(redirectTo.value)
    return
  }
  step.value = 1
}

async function handleProfile(nickname: string) {
  submitting.value = true
  const ok = await auth.completeOnboarding(nickname)
  submitting.value = false
  if (ok) router.replace(redirectTo.value)
}

function back() {
  step.value = 0
}
</script>

<template>
  <main class="bg-cream flex min-h-screen items-center justify-center px-5 py-10">
    <div class="w-full max-w-105">
      <!-- 단계 표시 -->
      <ol class="mb-6 flex items-center gap-2" aria-label="온보딩 진행 단계">
        <li v-for="(label, i) in STEPS" :key="label" class="flex flex-1 flex-col gap-1.5">
          <span
            class="h-1 rounded-full transition"
            :class="i <= step ? 'bg-terra' : 'bg-line'"
            aria-hidden="true"
          />
          <span
            class="text-[11px] tabular-nums"
            :class="i === step ? 'text-terra font-semibold' : 'text-faint'"
          >
            {{ i + 1 }}. {{ label }}
          </span>
        </li>
      </ol>

      <TermsAgreement
        v-if="step === 0"
        :terms="auth.terms"
        :agreed-ids="agreedIds"
        @submit="handleTerms"
      />
      <OnboardingStep
        v-else
        :error="auth.onboardingError"
        :pending="submitting"
        @submit="handleProfile"
        @back="back"
      />
    </div>
  </main>
</template>
