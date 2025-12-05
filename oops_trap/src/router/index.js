import { createRouter, createWebHashHistory } from "vue-router";
import { useUserStore } from "@/stores/user";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomePage.vue"),
  },
  {
    path: "/createLobby",
    name: "CreateLobby",
    component: () => import("@/views/CreateLobbyPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: () => import("@/views/LobbyPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/game/:id?",
    name: "Game",
    component: () => import("@/views/GamePage.vue"),
  },
  {
    path: "/test-player",
    name: "TestPlayer",
    component: () => import("@/components/game/CurrentPlayer.vue"),
  },
  {
    path: "/map",
    name: "TestPlayer",
    component: () => import("@/views/MapOfGame.vue"),
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  userStore.initializeUser();

  if (to.meta.requiresAuth && !userStore.user) {
    next("/");
  } else {
    next();
  }
});

export default router;
