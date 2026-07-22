# BidLive Frontend — 작업 규칙

라이브 비크리 경매 + 낙찰가 예측 베팅 플랫폼의 프론트엔드 (Vue 3 + TS + Tailwind v4 + Pinia).
사람과 AI 에이전트 공통 규칙. 배경 설명은 `docs/01-스택-결정-기록.md`, `docs/02-협업-가이드.md` 참조.

## 절대 규칙 (위반 금지)

1. **색·폰트 하드코딩 금지.** 반드시 토큰 클래스만 사용 (`bg-cream`, `text-terra`, `text-on-dark-dim` 등).
   토큰 정의는 `src/app/styles/main.css`의 `@theme` 블록이 유일한 위치다.
   새 색이 필요하면 임의로 추가하지 말고 디자인 단일 소스(기획 레포 `비드라이브 인터랙티브.html`)와 대조 후 추가한다.
2. **`tailwind.config.js`를 만들지 말 것.** Tailwind v4는 CSS-first(`@theme`) 방식이다. v3 문서 기준으로 작업하지 않는다.
3. **`package-lock.json` 삭제·재생성 금지. TypeScript 버전(`~6.0.x`) 업그레이드 금지** (vue-tsc 호환 제약).
4. **FE2 소유 영역을 합의 없이 수정하지 말 것**: `features/live/media/`·`features/live/socket/`, `features/chat/`, `stores/live.ts`.
   단 `features/live/LiveView.vue`·`LiveLayout.vue`는 FE1 소유(프레임)다. 입찰·예측 패널은 `features/bid/`·`features/prediction/`(FE1).
   상대 소유 컴포넌트는 import는 자유, 내부 수정만 사전 합의 대상.
   `stores/live.ts`의 state·action 시그니처는 FE1·FE2 합의 사항(`docs/03-역할-경계-합의.md` §3)이다 — 변경은 제안만 하고 임의 커밋하지 않는다.
5. **타이머를 클라이언트에서 자체 계산하지 말 것.** 남은 시간은 항상 `live` 스토어의 `endsAt` + `serverOffset`(서버 권위, BID-05) 기준으로 표시만 한다. `Date.now()` 단독 계산 금지.
6. **비크리 비공개 원칙**: 진행 중 화면에 타인의 입찰 금액·순위·최고가를 표시하는 UI를 만들지 않는다.
   공개 가능한 것은 입찰 건수·참여자 수·**본인** 입찰가뿐. 전체 입찰 내역은 종료 후 결과 화면에서만(마스킹).
7. **예측 베팅은 신 설계 기준**: 금액 직접 입력 + 스테이크, 오차율 고정 배당(×5/×3/×1, 미적중 ×0).
   "구간(bucket) 선택"·"실시간 분포 그래프"가 나오는 문서·명세는 폐기된 구 설계다 — 따라 만들지 않는다.
   베팅 분포는 라이브 중 노출 금지, 종료 후 오차 밴드별 결과로만 공개.
   **입찰과 예측은 배타적이다** — 한 방에서 한 사람은 둘 중 하나로만 참여한다(`auction_participant` UNIQUE 제약).
   입장 시 강제 선택은 없고(구경만 해도 된다), **첫 액션 시점에 역할이 확정**되며 이후 다른 쪽은 잠긴다.
   따라서 `#action` 패널을 자유롭게 오가는 탭으로 만들지 않는다. 상세는 `docs/03-역할-경계-합의.md` §4-1.
8. **HTTP 호출은 `shared/api/http.ts`의 axios 인스턴스만 사용.** 컴포넌트에서 `fetch`·개별 `axios` 직접 호출 금지.
9. **WebSocket 이벤트는 `{ type: string, data: object }` 래핑 포맷** (백엔드 공통 규격). 목 소켓 이벤트도 같은 모양으로 만든다.

## 컨벤션

- 컴포넌트: PascalCase `.vue`, 라우트 화면은 `*View.vue`로 끝나며 `features/<도메인>/`에 둔다.
- `<script setup lang="ts">` 사용. props/emits는 타입 기반 선언.
- composable은 `use*` 접두사, 공용 유틸은 `shared/lib/`.
- 공통 컴포넌트는 미리 만들지 않는다 — 같은 UI가 **두 번째로 등장할 때** `shared/ui/`로 추출.
- 금액·타이머 등 숫자는 tabular numbers 유틸로 자릿수 흔들림을 방지.
- 환경변수는 `VITE_` 접두사, API 베이스는 `VITE_API_BASE_URL`.

## 커밋

- Conventional Commits 한국어: `feat:` `fix:` `chore:` `docs:` `refactor:` `style:` + 명사형 요약 한 줄.
- 커밋 전 `npm run lint`와 `npm run build`(vue-tsc 타입체크 포함)가 통과해야 한다.
  서식은 `npm run format`으로 맞춘다 (CI가 `format:check`·`lint`·`build`를 모두 검사한다).
- 커밋 메시지에 AI co-author 트레일러를 넣지 않는다. **PR 본문에도 AI 생성 표기를 넣지 않는다.**
- 기능 브랜치는 `dev`를 base로 PR을 만든다. `main`은 데모 가능한 안정 상태로 두고 `dev`에서 주기적으로 머지한다.

## 도메인 용어 (기능 ID)

기획서 기능 ID를 주석·커밋에 그대로 쓴다: MEM(회원) · PNT(포인트/지갑) · ROOM(방) · LIVE(방송) ·
BID(입찰/경매) · CHAT(채팅) · PRED(예측 베팅) · DEAL(거래/결과). 예: `// BID-05 서버 권위 타이머`.
