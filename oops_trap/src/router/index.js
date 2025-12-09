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
    path: "/test-run",
    name: "TestRunnerr",
    component: () => import("@/components/game/RunnerTest.vue"),
  },
  {
    path: "/map",
    name: "MapOfGame",
    component: () => import("@/views/MapOfGame.vue"),
  },
  {
    path: "/physics-runner",
    name: "TestPhysics",
    component: () => import("@/components/game/RunnerPhysics.vue"),
  },
  {
    path: "/map-edit",
    name: "MapEdit",
    component: () => import("@/views/MapEditPage.vue"),
    //meta: { devOnly: true }
  },
  {
    path: "/map-physics-test",
    name: "MapPhysicsTest",
    component: () => import("@/views/MapPhysicsTest.vue"),
  },
  {
    path: "/test-move",
    name: "test-move",
    component: () => import("@/views/ServerMovement.vue"),
  },
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
