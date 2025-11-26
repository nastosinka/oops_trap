import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/createLobby',
    name: 'CreateLobby',
    component: () => import('@/views/CreateLobbyPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: () => import('@/views/LobbyPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id?',
    name: 'Game',
    component: () => import('@/views/GamePage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !token) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
