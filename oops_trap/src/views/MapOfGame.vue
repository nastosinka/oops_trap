<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <!-- Фон -->
      <component :is="CurrentMap" />
      <!-- Контроллер -->
      <div class="trap-controller-wrapper">
        <TrapController v-if="isMafia" :traps="traps" @activate="onTrapActivate" />
      </div>
      <div>
        Role: {{ userStore.gameMap }} <br>
        isMafia: {{ isMafia }}
      </div>
      <!-- Ловушки -->
      <component :is="trap.component" v-for="trap in traps" :key="trap.id" :active="activeTrapId === trap.id" />

      <!-- Другие игроки -->
      <OtherPlayers :players="otherPlayers" />

      <!-- Текущий игрок -->
      <RunnerPhysics v-if="!isMafia" ref="physicsPlayerRef" :game-area="gameArea" :polygons="polygons"
        @player-move="handlePlayerMove" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from "vue";
import RunnerPhysics from "@/components/game/player/general/CurrentPlayer.vue";
import OtherPlayers from "@/components/game/player/general/OtherPlayer.vue";
import { computed } from "vue";
import { useUserStore } from "@/stores/user";
import { TRAPS_BY_MAP } from "@/components/game/traps/registry";
import TrapController from "@/components/game/traps/TrapController.vue";
import GameMap1 from "@/components/game/maps/background/FirstMapBackground.vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";

const userStore = useUserStore();

const currentMap = computed(() =>
  userStore.gameMap === 2 ? "map2" : "map1"
);

const CurrentMap = computed(() =>
  userStore.gameMap === 2 ? GameMap2 : GameMap1
);

const traps = computed(() => TRAPS_BY_MAP[currentMap.value] || []);


const isMafia = computed(() => userStore.myRole === "mafia");
/* ----------------------------------
   Props
---------------------------------- */

const _props = defineProps({
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

// async function fetchPolygons() {
//   try {
//     const res = await fetch("/api/polygons/map2");
//     const data = await res.json();
//     polygons.value = data.polygons || [];
//   } catch (e) {
//     console.error("Polygon load error", e);
//   }
// }

async function fetchPolygons() {
  try {
    const map = userStore.gameMap === 2 ? "map2" : "map1";
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

  let width,
    height,
    mt = 0,
    ml = 0;

  if (ww / wh < 16 / 9) {
    width = ww;
    height = Math.round((ww * 9) / 16);
    mt = (wh - height) / 2;
  } else {
    height = wh;
    width = Math.round((wh * 16) / 9);
    ml = (ww - width) / 2;
  }

  gameContentRef.value.style.width = `${width}px`;
  gameContentRef.value.style.height = `${height}px`;
  gameContentRef.value.style.marginTop = `${mt}px`;
  gameContentRef.value.style.marginLeft = `${ml}px`;

  gameArea.value = {
    ...gameArea.value,
    width,
    height,
    scale: width / BASE_WIDTH,
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
  margin: 0;
  padding: 0;
  background-color: #2c3e50;
  overflow: hidden;
}

.game-content {
  position: relative;
  background-color: #2c3e50;
  transition: all 0.3s ease;
  width: 1920px;
  height: 1080px;
  transform-origin: top left;
}

.debug-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 1000;
  max-width: 300px;
}
</style>
