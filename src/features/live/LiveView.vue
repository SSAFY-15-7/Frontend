<script setup lang="ts">
// LIVE 라이브 화면 — 라우트 진입 + 프레임 조립 (FE1, docs/03-역할-경계-합의.md §1)
// #video·#chat은 FE2 컴포넌트가, #action은 FE1 입찰·예측 패널이 채운다. 지금은 placeholder.
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLiveStore } from '@/stores/live'
import LiveLayout from './LiveLayout.vue'

const route = useRoute()
const router = useRouter()
const live = useLiveStore()

// TODO: FE2 실소켓 연결 시 제거 — 개발용 fixture. 스토어 파일(stores/live.ts)은 수정하지 않고
// $patch로 값만 주입한다. endsAt은 서버 권위 마감 시각 흉내 (BID-05).
onMounted(() => {
  live.$patch({
    roomId: Number(route.params.id) || null,
    endsAt: Date.now() + 4 * 60_000 + 12_000, // 남은 04:12
    serverOffset: 0,
    extensionCount: 1,
  })
})

// TODO: FE2 실소켓 연결 시 제거 — 퇴장 시 fixture 정리
onUnmounted(() => {
  live.$reset()
})

function onBack() {
  router.push({ name: 'room-list' })
}
</script>

<template>
  <LiveLayout
    title="기계식 키보드 커스텀 풀빌드 (게이트론 저소음 적축)"
    seller-name="지훈"
    :viewer-count="24"
    @back="onBack"
  >
    <!-- FE2 — WebRTC 스테이지 (features/live/media/) 자리 -->
    <template #video>
      <div class="flex h-full w-full items-center justify-center">
        <p
          class="rounded-[10px] border border-dashed border-on-dark-dim/40 px-[18px] py-3 font-mono text-[13px] text-on-dark-dim"
        >
          FE2 — WebRTC 스트림 영역
        </p>
      </div>
    </template>

    <!-- FE1 — 입찰/예측 토글 패널 (features/bid/ · features/prediction/) 자리 -->
    <template #action>
      <div
        class="flex h-[220px] items-center justify-center rounded-[18px] border border-dashed border-faint/60 bg-line/40 text-[13px] text-dim"
      >
        입찰/예측 패널 (FE1 후속 작업)
      </div>
    </template>

    <!-- FE2 — ChatPanel (features/chat/) 자리 -->
    <template #chat>
      <div
        class="flex h-full items-center justify-center rounded-[20px] border border-dashed border-faint/60 bg-line/40 text-[13px] text-dim"
      >
        FE2 — 채팅 패널 영역
      </div>
    </template>
  </LiveLayout>
</template>
