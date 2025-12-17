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
    path: "/test-run", // только движение ;(
    name: "TestRunnerr",
    component: () => import("@/components/game/RunnerTest.vue"),
  },
  {
    path: "/map", // нет полигонов, спавн по таймеру, шикшакшок
    name: "MapOfGame",
    component: () => import("@/views/MapOfGame.vue"),
  },
  {
    path: "/physics-runner", // только падение
    name: "TestPhysics",
    component: () => import("@/components/game/RunnerPhysicsEdited.vue"),
  },
  {
    path: "/map-edit", // редактура полигонов
    name: "MapEdit",
    component: () => import("@/tools/MapEditPage.vue"),
    //meta: { devOnly: true }
  },
  {
    path: "/map-physics-test", // не всю карту можно бегать, но видны полигоны
    name: "MapPhysicsTest",
    component: () => import("@/test/MapPhysicsTest.vue"),
  },
  {
    path: "/hui", 
    name: "Hui",
    component: () => import("@/test/MapPhysicsTest.vue"),
    //meta: { devOnly: true }
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
