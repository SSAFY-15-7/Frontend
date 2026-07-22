import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'room-list', component: () => import('@/features/room/RoomListView.vue') },
    { path: '/login', name: 'login', component: () => import('@/features/auth/LoginView.vue') },
    {
      // MEM 온보딩 — 닉네임(nullable)·필수 약관 동의를 받는 게이트.
      // 약관이 개정되면 로그인한 회원도 다시 여기로 온다 (docs/04 §5.1).
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/features/auth/OnboardingView.vue'),
    },
    {
      path: '/rooms/new',
      name: 'room-create',
      component: () => import('@/features/room/RoomCreateView.vue'),
    },
    {
      path: '/rooms/:id/waiting',
      name: 'waiting-room',
      component: () => import('@/features/room/WaitingRoomView.vue'),
    },
    {
      path: '/rooms/:id/live',
      name: 'live',
      component: () => import('@/features/live/LiveView.vue'),
    },
    {
      path: '/rooms/:id/result',
      name: 'result',
      component: () => import('@/features/result/ResultView.vue'),
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/features/wallet/WalletView.vue'),
    },
    { path: '/me', name: 'my-page', component: () => import('@/features/auth/MyPageView.vue') },
  ],
})

// MEM 온보딩 가드.
// `member.nickname`이 nullable이고 필수 약관 동의가 별도 테이블이라, "로그인은 됐지만 온보딩 미완료"
// 상태가 정상적으로 존재한다. 그 상태에서는 /onboarding에 붙잡는다.
// 로그아웃 상태는 아무것도 막지 않는다 — 목 단계에서 비로그인 열람을 유지하기 위해서다.
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path === '/onboarding' && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.query.redirect ?? '/' } }
  }
  if (auth.needsOnboarding && to.path !== '/onboarding' && to.path !== '/login') {
    return { path: '/onboarding', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
