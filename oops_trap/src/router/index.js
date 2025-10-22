import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomePage.vue"),
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: () => import("@/views/CreateLobbyPage.vue"),
  },
  // {
  //   path: '/game',
  //   name: 'Game',
  //   component: () => import('@/views/GameView.vue')
  // },
  // {
  //   path: '/results',
  //   name: 'Results',
  //   component: () => import('@/views/ResultsView.vue')
  // }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
