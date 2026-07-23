import { defineStore } from 'pinia'
import { mockRooms, type Room, type RoomState } from '@/mocks/rooms'
import { categoryNameByCode } from '@/mocks/categories'

export type { Room, RoomState }

/** product.condition_status — nullable + CHECK IN ('NEW','LIKE_NEW','USED','DAMAGED') */
export type ConditionStatus = 'NEW' | 'LIKE_NEW' | 'USED' | 'DAMAGED'

/** auction_room.start_type — CHECK IN ('IMMEDIATE','SCHEDULED') */
export type StartType = 'IMMEDIATE' | 'SCHEDULED'

/**
 * product_image 한 장.
 * - `sortOrder`는 1부터 연속 (`sort_order > 0` + `UNIQUE(product_id, sort_order)`)
 * - `isThumbnail`은 전체에서 최대 1장만 true (`uq_product_single_thumbnail`, 0장도 허용)
 */
export interface ProductImageDraft {
  /** 로컬 미리보기 식별자 (서버 전송 대상 아님) */
  id: string
  imageUrl: string
  sortOrder: number
  isThumbnail: boolean
}

/**
 * ROOM-01 방 개설 요청 페이로드.
 * `product` + `product_image[]` + `auction_room` 3개 테이블을 한 번에 만드는 형태로 가정한다
 * (단일 요청인지 단계별인지는 백엔드 확인 필요 — docs/04 §6.4).
 * `moderation_status`는 서버가 정하므로 페이로드에 없다 (등록 직후 PENDING).
 */
export interface CreateRoomPayload {
  product: {
    /** product.title VARCHAR(100) NOT NULL */
    title: string
    /** product.description TEXT NOT NULL — 빈 문자열 불가 */
    description: string
    /** product_category.code */
    categoryCode: string
    /** nullable — "선택 안 함"이 유효하다 */
    conditionStatus: ConditionStatus | null
    images: ProductImageDraft[]
  }
  room: {
    /** auction_room.reserve_price > 0 */
    reservePrice: number
    /** auction_room.duration_minutes > 0 */
    durationMinutes: number
    startType: StartType
    /** ck_auction_room_schedule: IMMEDIATE면 반드시 null, SCHEDULED면 반드시 값 (ISO 문자열) */
    scheduledAt: string | null
  }
}

export interface CreateRoomResult {
  roomId: number
  startType: StartType
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// 예약 방 카드에 붙일 시작 예정 라벨 (서버는 시각을 주고 포맷은 FE가 한다 — docs/04 §4.1)
function scheduledLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// 오너: FE1 (ROOM-01~07)
export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [] as Room[],
    loaded: false,
    creating: false,
  }),
  actions: {
    // ROOM-02 방 목록 조회
    loadRooms() {
      // TODO: http.ts 경유 실API로 교체 (GET /rooms) — shared/api/http.ts의 axios 인스턴스만 사용
      this.rooms = mockRooms
      this.loaded = true
    },

    // ROOM-01 방 개설 (상품 등록 + 경매 조건)
    async createRoom(payload: CreateRoomPayload): Promise<CreateRoomResult> {
      // TODO: shared/api/http.ts 경유 실API로 교체 (POST /rooms) — 컴포넌트에서 직접 호출 금지
      this.creating = true
      try {
        await new Promise((resolve) => setTimeout(resolve, 400))

        if (!this.loaded) this.loadRooms()

        const roomId = this.rooms.reduce((max, r) => Math.max(max, r.id), 0) + 1
        const immediate = payload.room.startType === 'IMMEDIATE'

        // 목 응답: 서버가 만들어 줄 방을 목록 앞에 끼워 넣어 개설 직후 화면에서 보이게 한다.
        // 진행 시간은 서버가 ends_at(절대 시각)으로 확정하며, 여기서는 목 값일 뿐이다 (BID-05).
        const created: Room = {
          id: roomId,
          title: payload.product.title,
          category: categoryNameByCode(payload.product.categoryCode),
          state: immediate ? 'live' : 'waiting',
          startPrice: payload.room.reservePrice,
          bidCount: 0,
          participantCount: 0,
          viewerCount: 0,
          ...(immediate
            ? { endsAt: Date.now() + payload.room.durationMinutes * 60_000 }
            : { startsAtLabel: scheduledLabel(payload.room.scheduledAt ?? '') }),
        }
        this.rooms = [created, ...this.rooms]

        return { roomId, startType: payload.room.startType }
      } finally {
        this.creating = false
      }
    },
  },
})
