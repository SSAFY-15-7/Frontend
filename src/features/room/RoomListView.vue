<script setup lang="ts">
// ROOM-02 홈 · 방 목록 (FE1) — 상태 탭·카테고리 필터·카드 그리드
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import type { Room, RoomState } from '@/mocks/rooms'
import RoomCard from './RoomCard.vue'

const router = useRouter()
const roomStore = useRoomStore()

onMounted(() => {
  roomStore.loadRooms()
})

// 상태 탭: 진행중 / 대기 / 종료 (디자인 livelist 화면 기준)
const STATE_TABS: { state: RoomState; label: string }[] = [
  { state: 'live', label: '진행중' },
  { state: 'waiting', label: '대기' },
  { state: 'ended', label: '종료' },
]
const activeState = ref<RoomState>('live')

// 카테고리 칩 ('' = 전체)
const CATEGORIES = ['전자기기', '취미·수집', '패션·잡화', '생활용품', '도서·음반', '스포츠·레저']
const activeCategory = ref('')

const countByState = (state: RoomState) =>
  roomStore.rooms.filter((r) => r.state === state).length

const filteredRooms = computed(() => {
  const rooms = roomStore.rooms.filter(
    (r) =>
      r.state === activeState.value &&
      (activeCategory.value === '' || r.category === activeCategory.value),
  )
  // 진행중 목록은 남은 시간 오름차순 — 마감 임박이 먼저 (디자인 정렬 기준)
  if (activeState.value === 'live') {
    return [...rooms].sort((a, b) => (a.endsInSec ?? 0) - (b.endsInSec ?? 0))
  }
  return rooms
})

// 카드 클릭 → 상태별 라우팅: live→라이브 뷰, waiting→대기방, ended→결과(관전자)
function openRoom(room: Room) {
  if (room.state === 'live') router.push(`/rooms/${room.id}/live`)
  else if (room.state === 'waiting') router.push(`/rooms/${room.id}/waiting`)
  else router.push(`/rooms/${room.id}/result`)
}
</script>

<template>
  <main class="min-h-screen bg-cream">
    <div class="mx-auto max-w-7xl px-6 py-10">
      <!-- 헤더 + 검색바 (검색은 UI만, 동작 미구현) -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-[13px] text-dim">
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red" aria-hidden="true" />
            지금 방송 중
          </div>
          <h1 class="mt-1.5 text-[34px] font-bold tracking-tight text-ink">전체 라이브 방송</h1>
        </div>
        <div
          class="flex h-10.5 w-75 items-center gap-2 rounded-full border border-line bg-white px-4 text-faint transition focus-within:border-terra"
        >
          <svg class="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" />
          </svg>
          <input
            class="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint"
            placeholder="상품·카테고리 검색"
            aria-label="방송 검색"
          />
        </div>
      </div>

      <!-- 상태 탭 -->
      <div class="mt-5 inline-flex gap-1 rounded-xl bg-line p-1">
        <button
          v-for="tab in STATE_TABS"
          :key="tab.state"
          type="button"
          class="rounded-lg px-4 py-2 text-[13px] transition"
          :class="
            activeState === tab.state
              ? 'bg-white font-semibold text-ink shadow-sm'
              : 'text-dim hover:text-ink'
          "
          @click="activeState = tab.state"
        >
          {{ tab.label }}
          <span class="tabular-nums">{{ countByState(tab.state) }}</span>
        </button>
      </div>

      <!-- 카테고리 칩 -->
      <div class="mt-3.5 mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-2 text-[13px] font-medium transition"
          :class="
            activeCategory === ''
              ? 'bg-ink text-cream'
              : 'border border-line bg-white text-dim hover:bg-cream'
          "
          @click="activeCategory = ''"
        >
          전체
        </button>
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          type="button"
          class="rounded-full px-4 py-2 text-[13px] font-medium transition"
          :class="
            activeCategory === cat
              ? 'bg-ink text-cream'
              : 'border border-line bg-white text-dim hover:bg-cream'
          "
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- 카드 그리드 -->
      <div
        v-if="filteredRooms.length > 0"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <RoomCard
          v-for="room in filteredRooms"
          :key="room.id"
          :room="room"
          @select="openRoom"
        />
      </div>

      <!-- 빈 상태 + 방 만들기 CTA -->
      <div v-else class="py-18 text-center">
        <div class="text-[15px] font-semibold text-dim">조건에 맞는 방송이 없어요</div>
        <div class="mt-1.5 text-[12.5px] text-faint">
          검색어를 바꾸거나 카테고리를 넓혀 보세요
        </div>
        <RouterLink
          to="/rooms/new"
          class="mt-6 inline-flex items-center gap-1.5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-on-dark transition hover:bg-terra-d"
        >
          + 방 만들기
        </RouterLink>
      </div>
    </div>
  </main>
</template>
