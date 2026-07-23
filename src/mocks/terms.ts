// MEM 약관 목 데이터 — 백엔드 `terms` 테이블 컬럼을 그대로 카멜케이스로 옮겼다.
// 스키마: terms(terms_id, terms_type, version, title, content, is_required, is_active, effective_at)
// 서버는 "현재 유효한 약관"(is_active = TRUE AND effective_at <= now)만 내려줄 것으로 보이지만(docs/04 §3.6),
// 목에서는 비활성/미래 발효 케이스도 한 건 넣어 필터링이 실제로 동작하는지 확인할 수 있게 했다.

/** `terms.terms_type` — CHECK 제약이 없어 값 목록은 백엔드 확인 대상 (docs/04 §6.1). 현재는 목 기준. */
export type TermsType = 'SERVICE' | 'PRIVACY' | 'POINT' | 'MARKETING' | 'LOCATION'

export interface Terms {
  /** `terms.terms_id` BIGINT — 직렬화 형식 확인 전까지 number 유지 (docs/04 §6.3) */
  id: number
  type: TermsType
  /** `terms.version` VARCHAR(20) — 개정되면 새 행이 생기고 재동의가 필요하다 */
  version: string
  /** `terms.title` VARCHAR(100) */
  title: string
  /** `terms.content` TEXT — 전문. 모달로 보여준다 */
  content: string
  /** `terms.is_required` — TRUE면 미동의 시 다음 단계 진행 불가 */
  isRequired: boolean
  /** `terms.is_active` */
  isActive: boolean
  /** `terms.effective_at` TIMESTAMPTZ — 목은 ISO 문자열로 둔다 */
  effectiveAt: string
  /** 동의 목록 한 줄 요약 — 스키마에 없는 화면 전용 보조 문구 */
  summary?: string
}

export const mockTerms: Terms[] = [
  {
    id: 1,
    type: 'SERVICE',
    version: '1.0',
    title: '[필수] 서비스 이용약관',
    isRequired: true,
    isActive: true,
    effectiveAt: '2026-01-01T00:00:00+09:00',
    summary: '경매 참여, 낙찰 시 거래 의무에 관한 내용',
    content: [
      '제1조 (목적)',
      '이 약관은 BidLive(이하 "서비스")가 제공하는 실시간 비공개 경매 및 낙찰가 예측 서비스의 이용 조건과 절차를 정합니다.',
      '',
      '제2조 (입찰의 효력)',
      '회원이 제출한 입찰은 취소할 수 없으며, 최고가 입찰자는 2등 입찰가를 지불하고 상품을 낙찰받습니다.',
      '입찰 시점에 해당 금액이 거래 포인트에서 홀드되며, 미낙찰 시 종료 즉시 전액 해제됩니다.',
      '',
      '제3조 (거래 의무)',
      '낙찰자는 낙찰 후 정해진 기간 내에 배송지를 입력해야 하며, 판매자는 발송 후 송장 정보를 등록해야 합니다.',
      '정당한 사유 없이 거래를 이행하지 않으면 이용이 제한될 수 있습니다.',
    ].join('\n'),
  },
  {
    id: 2,
    type: 'PRIVACY',
    version: '1.0',
    title: '[필수] 개인정보 수집·이용 동의',
    isRequired: true,
    isActive: true,
    effectiveAt: '2026-01-01T00:00:00+09:00',
    summary: '카카오 계정 식별자, 닉네임',
    content: [
      '1. 수집 항목',
      '카카오 계정 식별자(provider_user_id), 회원이 직접 입력한 닉네임.',
      '서비스는 카카오 로그인만 지원하며, 그 밖의 소셜 계정 정보는 수집하지 않습니다.',
      '',
      '2. 이용 목적',
      '회원 식별, 경매·예측 참여 이력 관리, 포인트 정산, 부정 이용 방지.',
      '',
      '3. 보유 기간',
      '탈퇴 시까지 보유합니다. 다만 거래·정산 기록은 관계 법령에 따라 별도 기간 보관되며,',
      '탈퇴한 회원의 채팅 메시지는 발신자 정보가 삭제된 상태로 남습니다.',
    ].join('\n'),
  },
  {
    id: 3,
    type: 'POINT',
    version: '1.1',
    title: '[필수] 포인트 이용약관',
    isRequired: true,
    isActive: true,
    effectiveAt: '2026-03-01T00:00:00+09:00',
    summary: '거래 포인트·베팅 포인트의 성격과 소멸 기준',
    content: [
      '1. 이중 포인트 구조',
      '거래 포인트(TRADE)는 충전·환급이 가능한 재화로 입찰과 낙찰 대금 지불에 사용합니다.',
      '베팅 포인트(BETTING)는 충전할 수 없는 무료 재화로 가입·출석·예측 적중으로만 지급됩니다.',
      '두 포인트는 서로 전환되지 않습니다.',
      '',
      '2. 홀드',
      '입찰·예측 시 해당 금액은 사용 가능 잔액에서 보류 잔액으로 이동하며, 총 보유량은 변하지 않습니다.',
      '',
      '3. 예측 배당',
      '낙찰가 대비 오차율에 따라 스테이크의 ×5 / ×3 / ×1이 지급되며, 밴드를 벗어나면 지급되지 않습니다(×0).',
    ].join('\n'),
  },
  {
    id: 4,
    type: 'MARKETING',
    version: '1.0',
    title: '[선택] 마케팅 정보 수신 동의',
    isRequired: false,
    isActive: true,
    effectiveAt: '2026-01-01T00:00:00+09:00',
    summary: '관심 카테고리 경매 오픈 알림, 이벤트 소식',
    content: [
      '관심 카테고리의 경매가 열릴 때와 이벤트·혜택 소식을 카카오 알림톡으로 보내드립니다.',
      '동의하지 않아도 서비스 이용에는 제한이 없으며, 마이페이지에서 언제든 동의를 철회할 수 있습니다.',
    ].join('\n'),
  },
  {
    id: 5,
    type: 'LOCATION',
    version: '1.0',
    title: '[선택] 위치정보 이용 동의',
    isRequired: false,
    isActive: true,
    effectiveAt: '2026-01-01T00:00:00+09:00',
    summary: '가까운 지역의 직거래 가능 경매 추천',
    content: [
      '기기의 대략적인 위치를 이용해 직거래가 가능한 지역의 경매를 우선 추천합니다.',
      '동의하지 않아도 전체 경매를 그대로 이용할 수 있으며, 마이페이지에서 철회할 수 있습니다.',
    ].join('\n'),
  },
  {
    // 개정 예정본 — is_active는 TRUE지만 effective_at이 미래다. 지금 동의 화면에 뜨면 안 된다.
    id: 6,
    type: 'SERVICE',
    version: '2.0',
    title: '[필수] 서비스 이용약관 (개정 예정)',
    isRequired: true,
    isActive: true,
    effectiveAt: '2027-01-01T00:00:00+09:00',
    summary: '발효 전 버전 — 목록 필터 확인용',
    content: '발효일 이후부터 적용되는 개정본입니다.',
  },
]

/** 지금 동의를 받아야 하는 약관 = 활성 + 발효일 도래. `UNIQUE(terms_type, version)`이므로 타입별 최신 1건만 남긴다. */
export function activeTerms(now: number = Date.now()): Terms[] {
  const effective = mockTerms.filter((t) => t.isActive && Date.parse(t.effectiveAt) <= now)
  const latestByType = new Map<TermsType, Terms>()
  for (const t of effective) {
    const prev = latestByType.get(t.type)
    if (!prev || Date.parse(t.effectiveAt) >= Date.parse(prev.effectiveAt))
      latestByType.set(t.type, t)
  }
  // 필수 먼저, 그 다음 선택 — 화면 순서와 동일하게 정렬해서 내려준다
  return [...latestByType.values()].sort((a, b) => {
    if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1
    return a.id - b.id
  })
}
