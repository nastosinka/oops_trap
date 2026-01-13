<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <!-- Фон -->
      <component :is="CurrentMap" />

      <!-- Контроллер ловушек -->
      <div class="trap-controller-wrapper">
        <TrapController v-if="isMafia" :traps="traps" @activate="onTrapActivate" />
      </div>

      <!-- Ловушки -->
      <component v-for="trap in traps" :key="trap.id" :is="trap.component" :active="trapsState[trap.name]" />

      <!-- Другие игроки -->
      <OtherPlayers :players="otherPlayers" />

      <!-- Текущий игрок -->
      <CurrentPlayer v-if="!isMafia" ref="physicsPlayerRef" :game-area="gameArea" :polygons="polygons"
        @player-move="handlePlayerMove" />
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watchEffect,
  onMounted,
  onUnmounted,
  provide,
} from "vue";

import { useUserStore } from "@/stores/user";
import { TRAPS_BY_MAP } from "@/components/game/traps/registry";

import TrapController from "@/components/game/traps/TrapController.vue";
import CurrentPlayer from "@/components/game/player/general/CurrentPlayer.vue";
import OtherPlayers from "@/components/game/player/general/OtherPlayer.vue";

import GameMap1 from "@/components/game/maps/background/FirstMapBackground.vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";

/* ----------------------------------
   Store / Role / Map
---------------------------------- */

const userStore = useUserStore();

const isMafia = computed(() => userStore.myRole === "mafia");

const currentMap = computed(() =>
  userStore.gameMap === 2 ? "map2" : "map1"
);

const CurrentMap = computed(() =>
  userStore.gameMap === 2 ? GameMap2 : GameMap1
);

/* ----------------------------------
   Traps
---------------------------------- */

const traps = computed(() => TRAPS_BY_MAP[currentMap.value] || []);

const trapsState = reactive({});

watchEffect(() => {
  traps.value.forEach((trap) => {
    if (!(trap.name in trapsState)) {
      trapsState[trap.name] = false;
    }
  });
});

function onTrapActivate(trap) {
  trapsState[trap.name] = true;

  setTimeout(() => {
    trapsState[trap.name] = false;
  }, trap.cooldown);
}

/* ----------------------------------
   Props
---------------------------------- */

defineProps({
  otherPlayers: {
    type: Array,
    default: () => [],
  },
});

/* ----------------------------------
   Refs
---------------------------------- */

const screenRef = ref(null);
const gameContentRef = ref(null);
const physicsPlayerRef = ref(null);

/* ----------------------------------
   Game area
---------------------------------- */

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const gameArea = ref({
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  scale: 1,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  marginTop: 0,
  marginLeft: 0,
});

provide("gameArea", gameArea);

/* ----------------------------------
   Player move
---------------------------------- */

function handlePlayerMove(coords) {
  window.dispatchEvent(
    new CustomEvent("player-coords-update", { detail: coords })
  );
}

/* ----------------------------------
   Polygons
---------------------------------- */

const polygons = ref([]);

async function fetchPolygons() {
  try {
    const map = currentMap.value;
    const res = await fetch(`/api/polygons/${map}`);
    const data = await res.json();
    polygons.value = data.polygons || [];
  } catch (e) {
    console.error("Polygon load error", e);
  }
}

/* ----------------------------------
   Resize / Scale
---------------------------------- */

function updateScreenSize() {
  if (!screenRef.value || !gameContentRef.value) return;

  const ww = window.innerWidth;
  const wh = window.innerHeight;

  let scale, mt = 0, ml = 0;

  if (ww / wh < 16 / 9) {
    scale = ww / BASE_WIDTH;
  } else {
    scale = wh / BASE_HEIGHT;
  }

  scale = Math.round(scale * 1000) / 1000;

  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;

  ml = Math.round((ww - width) / 2);
  mt = Math.round((wh - height) / 2);

  // ❗ ВАЖНО: базовые размеры НЕ меняем
  gameContentRef.value.style.width = `${BASE_WIDTH}px`;
  gameContentRef.value.style.height = `${BASE_HEIGHT}px`;

  // ❗ ВЕСЬ SCALE ЗДЕСЬ
  // gameContentRef.value.style.transform =
  //   `translate(${ml}px, ${mt}px) scale(${scale})`;
  gameContentRef.value.style.transform = `translate(${ml}px, ${mt}px)`;
  gameContentRef.value.style.zoom = scale;
  
  gameArea.value = {
    ...gameArea.value,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    scale,
    marginTop: mt,
    marginLeft: ml,
  };
}



let resizeTimer;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateScreenSize, 50);
}

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(() => {
  fetchPolygons();
  updateScreenSize();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  clearTimeout(resizeTimer);
});
</script>

<style scoped>
.game-screen {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #2c3e50;
  overflow: hidden;
}

.game-content {
  position: relative;
  width: 1920px;
  height: 1080px;
  background-color: #2c3e50;
  transform-origin: top left;
  transition: none;
}
</style>
