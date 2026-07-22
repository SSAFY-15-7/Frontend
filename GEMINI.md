# BidLive Frontend — Gemini 컨텍스트

이 레포의 작업 규칙은 `AGENTS.md`가 단일 소스다. 아래 import를 통해 전체 규칙을 그대로 읽는다.

@./AGENTS.md

---

## PR 리뷰 시 중점 확인 항목

리뷰는 **한국어**로 작성한다. 위 `AGENTS.md`의 "절대 규칙"은 스타일 제안이 아니라 위반 시 **반드시 지적해야 하는 항목**이다. 특히 diff에서 다음을 확인한다.

1. **색·폰트 하드코딩** — `bg-[#...]`, `text-[14px]`, `style="color: ..."`, 인라인 hex/rgb 값.
   토큰 클래스(`bg-cream`, `text-terra`, `text-on-dark-dim` 등)만 허용된다.
   `src/app/styles/main.css`의 `@theme` 블록 외부에서 색을 정의하면 위반.
2. **`tailwind.config.js` 신규 생성** — Tailwind v4는 CSS-first다. 이 파일이 추가되면 무조건 지적.
3. **`package-lock.json` 삭제·재생성**, **TypeScript 버전 변경**(`~6.0.x` 고정, vue-tsc 호환 제약).
4. **FE2 소유 영역 변경** — `features/live/media/`·`features/live/socket/`, `features/chat/`, `stores/live.ts`.
   (`features/live/LiveView.vue`·`LiveLayout.vue`는 FE1 소유 프레임, `features/bid/`·`features/prediction/`은 FE1이므로 예외.)
   특히 `stores/live.ts`의 state·action 시그니처 변경(`docs/03-역할-경계-합의.md` §3)은
   FE1·FE2 합의 사항이므로, PR 본문에 합의 언급이 없으면 지적.
5. **클라이언트 자체 타이머 계산** — `Date.now()` 단독으로 남은 시간을 계산하는 코드.
   반드시 `live` 스토어의 `endsAt` + `serverOffset`(BID-05 서버 권위) 기준이어야 한다.
6. **비크리 비공개 원칙 위반** — 경매 진행 중 화면에 타인의 입찰 금액·순위·최고가를 노출하는 UI.
   진행 중 공개 가능한 것은 입찰 건수·참여자 수·**본인** 입찰가뿐이다.
7. **예측 베팅 구 설계 유입** — "구간(bucket) 선택", "실시간 베팅 분포 그래프"가 등장하면 폐기된 구 설계다.
   신 설계는 금액 직접 입력 + 스테이크, 오차율 고정 배당(×5/×3/×1)이며, 분포는 종료 후에만 공개한다.
8. **HTTP 호출 경로** — 컴포넌트에서 `fetch(` 또는 `axios.get/post` 직접 호출.
   반드시 `shared/api/http.ts`의 axios 인스턴스를 거쳐야 한다.
9. **WebSocket 이벤트 포맷** — `{ type: string, data: object }` 래핑을 벗어난 이벤트. 목 소켓도 동일 포맷이어야 한다.

## 컨벤션 확인

- 라우트 화면은 `*View.vue`, `features/<도메인>/`에 위치.
- `<script setup lang="ts">` + 타입 기반 props/emits 선언.
- composable은 `use*` 접두사, 공용 유틸은 `shared/lib/`.
- **공통 컴포넌트 조기 추출 금지** — 같은 UI가 두 번째로 등장할 때 비로소 `shared/ui/`로 뺀다.
  첫 등장부터 `shared/ui/`에 만들었다면 지적.
- 금액·타이머 등 숫자는 tabular numbers 유틸 사용(자릿수 흔들림 방지).
- 환경변수는 `VITE_` 접두사, API 베이스는 `VITE_API_BASE_URL`.

## 리뷰 톤

- 위 절대 규칙 위반은 **Critical / High**로 분류한다.
- 규칙 위반이 없더라도 리뷰를 끝내지 않는다 — 버그·엣지 케이스·타입 안정성·
  에러 처리·비동기 정리·성능·접근성은 항상 함께 검토한다.
- 지적할 때는 파일·라인과 함께 **수정된 코드 예시**를 제시한다.
- 단순 취향 차이나 사소한 네이밍은 코멘트하지 않는다 — 노이즈를 줄이는 쪽을 택한다.
- 확신이 없으면 단정하지 말고 질문 형태로 남긴다.
- 정말 문제가 없으면 억지로 지적을 만들지 않는다.
- **이모지를 쓰지 않는다.** 체크마크·경고 표시 등 장식 기호도 쓰지 않고,
  심각도는 텍스트로만 표기한다.
