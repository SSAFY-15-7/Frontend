import { computed, onUnmounted, ref } from 'vue'
import { useLiveStore } from '@/stores/live'

// BID-05 서버 권위 타이머 — 남은 시간은 live 스토어의 endsAt + serverOffset 기준으로 "표시만" 한다.
// 클라이언트가 자체 카운트다운 상태를 갖지 않는다: 1초 틱은 현재 시각 갱신용일 뿐이고,
// 남은 시간 = endsAt - (Date.now() + serverOffset). Date.now() 단독 계산 금지.
export function useCountdown() {
  const live = useLiveStore()
  const now = ref(Date.now())

  const timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onUnmounted(() => clearInterval(timer))

  /** 남은 ms. 스토어에 endsAt이 없으면 null (표시 측은 '--:--' 처리) */
  const remainingMs = computed<number | null>(() => {
    if (live.endsAt === null) return null
    return Math.max(0, live.endsAt - (now.value + live.serverOffset))
  })

  /** 'MM:SS' (1시간 이상이면 'H:MM:SS'), 값 없으면 '--:--' */
  const display = computed(() => {
    if (remainingMs.value === null) return '--:--'
    const total = Math.floor(remainingMs.value / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  })

  /** 마감 임박 (60초 이하) — 타이머 칩 강조용 */
  const urgent = computed(() => remainingMs.value !== null && remainingMs.value <= 60_000)

  return { remainingMs, display, urgent }
}
