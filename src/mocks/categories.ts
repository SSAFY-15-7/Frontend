// ROOM-01 상품 카테고리 목 데이터 — `product_category` 마스터 데이터 (서버 관리)
// 스키마: `product_category.code`가 UNIQUE, `name`은 VARCHAR(50).
// 표시는 name, 전송·필터는 code를 쓴다 (docs/04 §3.4).
// 현재 방 목록 목 데이터(`mocks/rooms.ts`)가 쓰는 한글 문자열은 name 쪽이다.

export interface ProductCategory {
  /** product_category.code — UNIQUE. 서버 전송·필터 키 */
  code: string
  /** product_category.name — 화면 표시용 (50자 제한) */
  name: string
}

// TODO: 실 API 전환 시 GET /product-categories 응답으로 교체 (shared/api/http.ts 경유)
export const mockCategories: ProductCategory[] = [
  { code: 'ELECTRONICS', name: '전자기기' },
  { code: 'HOBBY', name: '취미·수집' },
  { code: 'FASHION', name: '패션·잡화' },
  { code: 'LIVING', name: '생활용품' },
  { code: 'MEDIA', name: '도서·음반' },
  { code: 'SPORTS', name: '스포츠·레저' },
]

export const categoryNameByCode = (code: string): string =>
  mockCategories.find((c) => c.code === code)?.name ?? code
