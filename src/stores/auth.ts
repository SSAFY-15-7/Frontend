import { defineStore } from 'pinia'
import { activeTerms, type Terms } from '@/mocks/terms'

// 오너: FE1 (MEM)
// 스키마 정렬: `member`는 nickname / role / status / withdrawn_at 만 가진다.
// 이메일·프로필 이미지·실명 컬럼이 없으므로 회원가입·온보딩에서 그런 입력을 받지 않는다 (docs/04 §3.6).

/** `member.status` — WITHDRAWN이면 `withdrawn_at`이 NOT NULL (ck_member_withdrawn_at) */
export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'
/** `member.role` — 관리자 화면이 MVP 범위인지는 미확정 (docs/04 §6.5) */
export type MemberRole = 'USER' | 'ADMIN'

/** `member.nickname` VARCHAR(30) UNIQUE — 전역 중복 불가 */
export const NICKNAME_MAX_LENGTH = 30

export interface MemberProfile {
  /** `member.member_id` BIGINT — 직렬화 형식 확인 전까지 number 유지 (docs/04 §6.3) */
  id: number
  /**
   * `member.nickname`은 nullable이다 — 카카오 로그인 직후 닉네임 미설정 = 온보딩 미완료 상태.
   * 이 필드가 null인 동안 라우터 가드가 `/onboarding`에 붙잡는다.
   */
  nickname: string | null
  role: MemberRole
  status: MemberStatus
  /** `member.withdrawn_at` — status가 WITHDRAWN일 때만 값이 있다 */
  withdrawnAt: string | null
}

/** `member_terms_agreement` 한 행. 유효 조합은 동의 / 미동의 / 철회 세 가지뿐이다 (docs/04 §3.6). */
export interface TermsAgreement {
  termsId: number
  isAgreed: boolean
  /** `agreed_at` — 동의한 적이 없으면 null */
  agreedAt: string | null
  /** `withdrawn_at` — 철회했으면 값이 있고 `is_agreed`는 FALSE다 */
  withdrawnAt: string | null
}

/** 온보딩에서 화면이 모아 넘기는 동의 결과 (약관 id → 동의 여부) */
export type TermsAgreementInput = Record<number, boolean>

/** 카카오 로그인 목 응답 — 실제로는 서버가 카카오 계정 식별자로 신규/기존을 판별한다 */
interface MockKakaoResult {
  member: MemberProfile
  agreements: TermsAgreement[]
}

// 목 시연 스위치: 첫 로그인 회원과 기존 회원을 둘 다 보여주기 위한 것.
// 실제로는 서버가 `social_account.provider_user_id`로 판별하므로 클라이언트가 고르는 값이 아니다.
function mockKakaoLogin(asNewMember: boolean, terms: Terms[]): MockKakaoResult {
  if (asNewMember) {
    // 신규: 닉네임 없음(온보딩 미완료), 동의 이력 없음
    return {
      member: { id: 1001, nickname: null, role: 'USER', status: 'ACTIVE', withdrawnAt: null },
      agreements: [],
    }
  }
  // 기존 회원: 닉네임 있고 필수 약관 동의 완료, 선택 약관은 미동의
  const agreedAt = new Date().toISOString()
  return {
    member: { id: 1002, nickname: '준호', role: 'USER', status: 'ACTIVE', withdrawnAt: null },
    agreements: terms.map((t) => ({
      termsId: t.id,
      isAgreed: t.isRequired,
      agreedAt: t.isRequired ? agreedAt : null,
      withdrawnAt: null,
    })),
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as MemberProfile | null,
    /** 현재 유효한 약관 목록 (`terms` where is_active AND effective_at <= now) */
    terms: [] as Terms[],
    /** 내 동의 이력 (`member_terms_agreement`) */
    agreements: [] as TermsAgreement[],
    /** 카카오 인증 진행 중 — 버튼 중복 클릭 방지 */
    authPending: false,
    /** 닉네임 중복(409) 등 온보딩 제출 실패 메시지 */
    onboardingError: null as string | null,
  }),
  getters: {
    isLoggedIn: (state) => state.user !== null,
    /** `member.status = 'SUSPENDED'` — 입찰·베팅·채팅을 잠그고 안내를 띄운다 (docs/04 §3.6) */
    isSuspended: (state) => state.user?.status === 'SUSPENDED',
    /** 탈퇴 회원. `withdrawn_at`이 NOT NULL인 것이 스키마 제약 */
    isWithdrawn: (state) => state.user?.status === 'WITHDRAWN',
    /** 필수 약관 중 아직 동의가 없는 것 — 개정으로 새 버전이 생기면 여기 다시 걸린다 */
    pendingRequiredTerms(state): Terms[] {
      const agreedIds = new Set(state.agreements.filter((a) => a.isAgreed).map((a) => a.termsId))
      return state.terms.filter((t) => t.isRequired && !agreedIds.has(t.id))
    },
    /** 닉네임 미설정(nullable) 또는 필수 약관 미동의 → 온보딩 게이트에 잡힌다 */
    needsOnboarding(state): boolean {
      if (state.user === null) return false
      if (state.user.nickname === null) return true
      return this.pendingRequiredTerms.length > 0
    },
  },
  actions: {
    /** 동의 화면을 그리기 전에 현재 유효한 약관을 받아 둔다 */
    loadTerms() {
      // TODO: shared/api/http.ts 경유 실API로 교체 (GET /terms?active=true)
      this.terms = activeTerms()
    },

    /**
     * MEM-01 카카오 로그인.
     * `social_account`에 `CHECK (provider = 'KAKAO')`가 걸려 있어 지원 provider는 카카오뿐이다.
     * 실제 OAuth 리다이렉트는 백엔드 준비 후 붙인다 — 지금은 목 세션만 만든다.
     */
    async loginWithKakao(asNewMember = true) {
      // TODO: shared/api/http.ts 경유 실API로 교체 (카카오 인가코드 → POST /auth/kakao)
      this.authPending = true
      this.onboardingError = null
      if (this.terms.length === 0) this.loadTerms()
      await new Promise((resolve) => setTimeout(resolve, 400))
      const result = mockKakaoLogin(asNewMember, this.terms)
      this.user = result.member
      this.agreements = result.agreements
      this.authPending = false
    },

    /**
     * MEM 약관 동의 저장. `UNIQUE(member_id, terms_id)`라 같은 약관은 회원당 1행이며 재동의는 UPDATE다.
     * 상태 조합은 동의 / 미동의 / 철회 세 가지만 유효하다.
     */
    agreeToTerms(input: TermsAgreementInput) {
      // TODO: shared/api/http.ts 경유 실API로 교체 (PUT /members/me/terms-agreements)
      const now = new Date().toISOString()
      for (const [termsIdText, isAgreed] of Object.entries(input)) {
        const termsId = Number(termsIdText)
        const existing = this.agreements.find((a) => a.termsId === termsId)
        if (!existing) {
          this.agreements.push({
            termsId,
            isAgreed,
            agreedAt: isAgreed ? now : null,
            withdrawnAt: null,
          })
          continue
        }
        if (isAgreed) {
          existing.isAgreed = true
          existing.agreedAt = now
          existing.withdrawnAt = null
        } else if (existing.isAgreed) {
          // 동의했던 건을 끄는 것은 "철회" — agreed_at은 남기고 withdrawn_at을 채운다
          existing.isAgreed = false
          existing.withdrawnAt = now
        } else {
          existing.isAgreed = false
        }
      }
    },

    /**
     * MEM 온보딩 완료 — 닉네임 설정. `member.nickname`은 UNIQUE라 중복이면 409가 온다.
     * 성공하면 needsOnboarding이 false가 되어 가드가 풀린다.
     */
    async completeOnboarding(nickname: string): Promise<boolean> {
      // TODO: shared/api/http.ts 경유 실API로 교체 (PATCH /members/me) — 409면 중복 닉네임
      this.onboardingError = null
      const trimmed = nickname.trim()
      if (trimmed.length === 0 || trimmed.length > NICKNAME_MAX_LENGTH) {
        this.onboardingError = `닉네임은 1~${NICKNAME_MAX_LENGTH}자로 입력해 주세요`
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
      // 목 중복 검사 — 실제 판정은 서버의 UNIQUE 제약이 한다
      if (trimmed === '준호') {
        this.onboardingError = '이미 사용 중인 닉네임이에요'
        return false
      }
      if (this.user) this.user.nickname = trimmed
      return true
    },

    logout() {
      // TODO: shared/api/http.ts 경유 실API로 교체 (POST /auth/logout)
      this.user = null
      this.agreements = []
      this.onboardingError = null
    },
  },
})
