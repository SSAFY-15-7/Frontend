<script setup lang="ts">
// MEM-01 로그인 · 회원가입 (FE1)
// 로그인/회원가입은 라우트를 나누지 않고 한 화면 안에서 모드만 바꾼다.
// OAuth라 두 화면의 처리가 동일하기 때문이다 — 신규/기존 분기는 카카오 응답 이후 서버가 판별한다.
// 신규(닉네임 null 또는 필수 약관 미동의)면 /onboarding으로, 기존 회원이면 홈으로 보낸다.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import KakaoAuthButton from './KakaoAuthButton.vue'
import SignupStep from './SignupStep.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

type AuthMode = 'login' | 'signup'
const mode = ref<AuthMode>(route.query.mode === 'signup' ? 'signup' : 'login')

// 시연 스위치 — 실제로는 서버가 social_account.provider_user_id로 판별한다.
// TODO: 실 API 연동 시 이 스위치와 관련 UI를 통째로 삭제한다.
const demoNewMember = ref(true)

// 로그인 후 돌아갈 곳 (가드가 붙여 준 redirect 쿼리)
const redirectTo = computed(() => {
  const raw = route.query.redirect
  return typeof raw === 'string' && raw.startsWith('/') ? raw : '/'
})

onMounted(() => {
  auth.loadTerms()
})

async function handleKakao() {
  if (auth.authPending) return
  await auth.loginWithKakao(demoNewMember.value)
  if (auth.needsOnboarding) {
    router.replace({ path: '/onboarding', query: { redirect: redirectTo.value } })
  } else {
    router.replace(redirectTo.value)
  }
}

function setMode(next: AuthMode) {
  mode.value = next
}
</script>

<template>
  <main class="bg-cream flex min-h-screen items-center justify-center px-5 py-10">
    <div class="w-full max-w-105">
      <!-- 회원가입: 서비스 소개 + 카카오 CTA -->
      <SignupStep
        v-if="mode === 'signup'"
        :pending="auth.authPending"
        @kakao="handleKakao"
        @to-login="setMode('login')"
      />

      <!-- 로그인: 빠르게 통과시키는 게 전부 -->
      <div v-else class="mx-auto w-full max-w-95 text-center">
        <div class="text-ink text-[34px] font-bold tracking-tighter">
          Bid<span class="text-terra">Live</span>
        </div>
        <p class="text-dim mt-2.5 text-[13.5px] leading-relaxed">다시 오셨네요</p>

        <KakaoAuthButton label="카카오로 로그인" :pending="auth.authPending" @click="handleKakao" />

        <p class="text-faint mt-3.5 text-[11.5px] leading-relaxed">
          아직 계정이 없으신가요?
          <button
            type="button"
            class="text-terra font-semibold underline"
            @click="setMode('signup')"
          >
            회원가입
          </button>
        </p>
      </div>

      <!-- 시연 전용 스위치 — 제품 UI가 아니다 -->
      <div
        class="border-line mt-6.5 flex items-center justify-center gap-2.5 border-t border-dashed pt-4.5"
      >
        <span class="text-faint text-[11px] font-semibold tracking-widest">시연</span>
        <div class="bg-line inline-flex gap-1 rounded-xl p-1">
          <button
            v-for="opt in [
              { value: true, label: '첫 로그인' },
              { value: false, label: '기존 회원' },
            ]"
            :key="String(opt.value)"
            type="button"
            class="rounded-lg px-3.5 py-1.5 text-xs transition"
            :class="
              demoNewMember === opt.value
                ? 'text-ink bg-white font-semibold shadow-sm'
                : 'text-dim hover:text-ink'
            "
            @click="demoNewMember = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
