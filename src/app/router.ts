import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'room-list', component: () => import('@/features/room/RoomListView.vue') },
    { path: '/login', name: 'login', component: () => import('@/features/auth/LoginView.vue') },
    { path: '/rooms/new', name: 'room-create', component: () => import('@/features/room/RoomCreateView.vue') },
    { path: '/rooms/:id/waiting', name: 'waiting-room', component: () => import('@/features/room/WaitingRoomView.vue') },
    { path: '/rooms/:id/live', name: 'live', component: () => import('@/features/live/LiveView.vue') },
    { path: '/rooms/:id/result', name: 'result', component: () => import('@/features/result/ResultView.vue') },
    { path: '/wallet', name: 'wallet', component: () => import('@/features/wallet/WalletView.vue') },
    { path: '/me', name: 'my-page', component: () => import('@/features/auth/MyPageView.vue') },
  ],
})

export default router
