<script setup lang="ts">
// LIVE 라이브 화면 슬롯 프레임 — 소유 FE1 (docs/03-역할-경계-합의.md §4)
// 슬롯 계약: #video(FE2 WebRTC 스트림) · #chat(FE2 ChatPanel) · #action(FE1 입찰↔예측 패널).
// 레이아웃·반응형·영역 크기 배분은 이 프레임 책임 — 슬롯 컴포넌트는 부모를 100% 채운다고 가정한다.
import { useCountdown } from './useCountdown'

withDefaults(
  defineProps<{
    /** 제품 타이틀 (스테이지 하단 정보 바) */
    title?: string
    /** 판매자 닉네임 */
    sellerName?: string
    /** 시청자 수 — null이면 미표시 (PRESENCE 이벤트 수신 전) */
    viewerCount?: number | null
  }>(),
  { title: '', sellerName: '', viewerCount: null },
)

const emit = defineEmits<{
  /** 헤더 뒤로가기(라이브 나가기) 클릭 */
  back: []
}>()

// BID-05 서버 권위 타이머 — live 스토어 endsAt + serverOffset 기준 표시 전용
const { display, urgent } = useCountdown()
</script>

<template>
  <!-- 데스크톱: 디자인 live-wrap(스테이지 + 344px 레일, 화면 고정) / 모바일: 세로 스택 페이지 스크롤 -->
  <div class="min-h-dvh bg-cream lg:h-dvh lg:overflow-hidden">
    <div class="flex flex-col gap-3.5 p-3 lg:h-full lg:flex-row lg:p-[18px]">
      <!-- ── 스테이지 (시네마틱 다크) — #video 슬롯 + 헤더 오버레이 ── -->
      <div class="min-w-0 lg:min-h-0 lg:flex-1">
        <div
          class="group relative aspect-video w-full overflow-hidden rounded-[20px] bg-stage shadow-2xl lg:aspect-auto lg:h-full"
        >
          <!-- FE2 스트림 컴포넌트가 이 영역을 100% 채운다 -->
          <div class="absolute inset-0">
            <slot name="video" />
          </div>

          <!-- 헤더(좌상단): 뒤로가기 · LIVE 뱃지 · 판매자 메타 -->
          <div class="absolute left-4 top-4 z-[4] flex items-center gap-2">
            <button
              type="button"
              class="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-white/10 text-on-dark backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="라이브 나가기"
              title="라이브 나가기"
              @click="emit('back')"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span
              class="inline-flex items-center gap-[5px] rounded-full bg-red px-2.5 py-1 text-[11px] font-bold text-white"
            >
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE
            </span>
            <span
              v-if="sellerName"
              class="rounded-full bg-white/10 px-3 py-[5px] text-xs text-on-dark backdrop-blur-sm"
            >
              판매자 {{ sellerName
              }}<template v-if="viewerCount !== null">
                · 시청 <span class="tabular-nums">{{ viewerCount }}</span
                >명</template
              >
            </span>
          </div>

          <!-- 타이머 칩(상단 중앙) — BID-05 서버 권위, 값 없으면 '--:--' -->
          <div
            class="absolute left-1/2 top-4 z-[6] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] text-on-dark shadow-lg backdrop-blur-md"
            :class="urgent ? 'border-red/60 bg-ink/80' : 'border-white/10 bg-ink/80'"
          >
            <span class="text-on-dark-dim">남은 시간</span>
            <span class="text-[17px] font-bold tabular-nums" :class="urgent && 'text-red'">{{
              display
            }}</span>
          </div>

          <!-- 제품 타이틀 바(하단) — 디자인 prodbar: hover 시 slide-in, 모바일은 상시 노출 -->
          <div
            class="absolute inset-x-0 bottom-0 z-[6] flex items-center gap-3 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-5 pb-4 pt-9 text-on-dark transition-all duration-300 lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 motion-reduce:transition-none"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold leading-tight">{{ title }}</div>
              <div v-if="sellerName" class="mt-[3px] text-xs text-on-dark-dim">
                판매자 {{ sellerName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 사이드 레일 (데스크톱 344px 고정) — #action 위 · #chat 아래 ── -->
      <div class="flex w-full flex-none flex-col gap-3 lg:min-h-0 lg:w-[344px]">
        <!-- 입찰↔예측 패널 영역 (FE1) -->
        <div class="flex-none">
          <slot name="action" />
        </div>
        <!-- 채팅 패널 영역 (FE2) — 데스크톱은 남은 높이 전부, 모바일은 고정 높이 -->
        <div class="h-[400px] lg:h-auto lg:min-h-0 lg:flex-1">
          <slot name="chat" />
        </div>
      </div>
    </div>
  </div>
</template>
