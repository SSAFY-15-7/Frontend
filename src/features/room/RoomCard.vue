<script setup lang="ts">
// ROOM-02 방 목록 카드 — 상태별(진행중/대기/종료)로 배지·우상단 카운트·하단 메타만 갈리고 골격은 공유
import { computed } from 'vue'
import type { Room } from '@/mocks/rooms'

const props = defineProps<{ room: Room }>()

const emit = defineEmits<{ select: [room: Room] }>()

const fmtPoint = (n: number) => `${n.toLocaleString('ko-KR')}P`

// BID-05: 남은 시간은 서버 스냅샷 값(endsInSec)의 요약 표시만 — 클라이언트 카운트다운 금지
const fmtMMSS = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const isUrgent = computed(
  () => props.room.state === 'live' && (props.room.endsInSec ?? 0) <= 180,
)

// 썸네일: 외부 이미지 URL 대신 토큰 기반 그라데이션 placeholder (카테고리별 색감)
const THUMB_BY_CATEGORY: Record<string, string> = {
  전자기기: 'from-slate-tint to-slate/40',
  '취미·수집': 'from-terra-tint to-terra/30',
  '패션·잡화': 'from-line to-faint/50',
  생활용품: 'from-cream to-line',
  '도서·음반': 'from-slate-tint to-line',
  '스포츠·레저': 'from-terra-tint to-line',
}
const thumbClass = computed(
  () => THUMB_BY_CATEGORY[props.room.category] ?? 'from-line to-faint/40',
)
</script>

<template>
  <article
    class="group cursor-pointer overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-faint hover:shadow-xl hover:shadow-stage/20"
    @click="emit('select', room)"
  >
    <!-- 썸네일 placeholder -->
    <div
      class="relative h-38 bg-gradient-to-br"
      :class="[thumbClass, room.state !== 'live' && 'brightness-95']"
    >
      <!-- 상태 배지 -->
      <span
        v-if="room.state === 'live'"
        class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red px-2.5 py-1 text-[11px] font-bold text-on-dark"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-on-dark" aria-hidden="true" />
        LIVE
      </span>
      <span
        v-else-if="room.state === 'waiting'"
        class="absolute top-3 left-3 rounded-full bg-slate px-2.5 py-1 text-[11px] font-bold text-on-dark"
      >
        대기
      </span>
      <span
        v-else
        class="absolute top-3 left-3 rounded-full bg-faint px-2.5 py-1 text-[11px] font-bold text-on-dark"
      >
        종료
      </span>

      <!-- 우상단 카운트: live=시청자, waiting=대기 인원 -->
      <span
        v-if="room.state === 'live'"
        class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-stage/60 px-2 py-1 text-[11px] text-on-dark tabular-nums backdrop-blur-sm"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {{ room.viewerCount }}
      </span>
      <span
        v-else-if="room.state === 'waiting'"
        class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-stage/60 px-2 py-1 text-[11px] text-on-dark tabular-nums backdrop-blur-sm"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
        </svg>
        {{ room.participantCount }}
      </span>

      <!-- 남은 시간 요약 (live만) — 목록 정렬 기준이므로 카드에 반드시 보인다 -->
      <span
        v-if="room.state === 'live'"
        class="absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-on-dark tabular-nums backdrop-blur-sm"
        :class="isUrgent ? 'bg-red/90' : 'bg-stage/60'"
      >
        {{ fmtMMSS(room.endsInSec ?? 0) }}
      </span>
    </div>

    <div class="px-4 pt-3.5 pb-4">
      <div class="mb-1 text-[10.5px] text-faint">{{ room.category }}</div>
      <div class="line-clamp-2 h-10 text-sm leading-snug font-semibold text-ink">
        {{ room.title }}
      </div>

      <!-- 하단 메타 — 비크리 비공개: 최고가·타인 입찰가 없음. 시작가·입찰 건수·참여 수만 -->
      <div class="mt-2.5 flex items-baseline justify-between gap-2">
        <template v-if="room.state === 'live'">
          <div class="text-xl font-bold tracking-tight text-ink tabular-nums">
            입찰 {{ room.bidCount }}건
          </div>
          <div class="text-xs text-dim tabular-nums">
            참여 {{ room.participantCount }} · 시작가 {{ fmtPoint(room.startPrice) }}
          </div>
        </template>
        <template v-else-if="room.state === 'waiting'">
          <div class="text-[15px] font-bold tracking-tight text-slate">
            {{ room.startsAtLabel }}
          </div>
          <div class="text-xs text-dim tabular-nums">시작가 {{ fmtPoint(room.startPrice) }}</div>
        </template>
        <template v-else>
          <!-- 낙찰가는 종료 후에만 공개 (비크리 비공개 원칙) -->
          <div class="text-xl font-bold tracking-tight text-ink tabular-nums">
            {{ fmtPoint(room.soldPrice ?? 0) }}
          </div>
          <div class="text-xs text-dim">{{ room.endedAtLabel }} 낙찰</div>
        </template>
      </div>
    </div>
  </article>
</template>
