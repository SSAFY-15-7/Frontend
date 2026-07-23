<script setup lang="ts">
// MEM 약관 전문 보기 — `terms.content`가 TEXT라 길다. 모달로 띄운다.
// 버전 관리 테이블(UNIQUE(terms_type, version))이므로 헤더에 버전·발효일을 반드시 같이 보여준다.
import type { Terms } from '@/mocks/terms'

defineProps<{ terms: Terms }>()

const emit = defineEmits<{ close: [] }>()

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div
    class="bg-stage/55 fixed inset-0 z-50 flex items-center justify-center p-5 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    :aria-label="terms.title"
    @click.self="emit('close')"
  >
    <div class="bg-surface flex max-h-[80vh] w-full max-w-150 flex-col overflow-hidden rounded-2xl">
      <header class="border-line flex items-start justify-between gap-4 border-b px-6 py-4.5">
        <div>
          <h2 class="text-ink text-base font-bold">{{ terms.title }}</h2>
          <p class="text-faint mt-1 text-[11.5px] tabular-nums">
            v{{ terms.version }} · {{ fmtDate(terms.effectiveAt) }} 발효
          </p>
        </div>
        <button
          type="button"
          class="text-faint hover:text-ink -mt-1 flex-none p-1 text-xl leading-none transition"
          aria-label="닫기"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div
        class="text-dim overflow-y-auto px-6 py-5 text-[13px] leading-relaxed whitespace-pre-line"
      >
        {{ terms.content }}
      </div>

      <footer class="border-line border-t px-6 py-3.5 text-right">
        <button
          type="button"
          class="bg-ink text-on-dark hover:bg-stage rounded-lg px-5 py-2.5 text-[13px] font-semibold transition"
          @click="emit('close')"
        >
          닫기
        </button>
      </footer>
    </div>
  </div>
</template>
