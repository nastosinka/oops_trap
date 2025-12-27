<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <!-- Фон -->
      <GameMap2 />

      <!-- Ловушки -->
      <!-- <TrapNum3 key="3" type="d" :active="false" />
      <TrapNum4 key="4" type="c" :active="false" />
      <TrapNum6 key="6" type="b" :active="false" />
      <TrapNum8 key="8" type="a" :active="false" /> -->
      <!-- Ловушки -->
      <component v-for="trap in traps" :key="trap.id" :is="trap.component" :active="activeTrapId === trap.id" />

      <!-- Контроллер -->
      <TrapController v-if="true" :traps="traps" @activate="onTrapActivate" />

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
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
import RunnerPhysics from "@/components/game/player/general/CurrentPlayer.vue";
import OtherPlayers from "@/components/game/player/general/OtherPlayer.vue";
import TrapNum3 from "@/components/game/traps/map2/TrapNum3.vue";
import TrapNum4 from "@/components/game/traps/map2/TrapNum4.vue";
import TrapNum6 from "@/components/game/traps/map2/TrapNum6.vue";
import TrapNum8 from "@/components/game/traps/map2/TrapNum8.vue";
import { computed } from "vue";
import { useUserStore } from "@/stores/user";
import { TRAPS_BY_MAP } from "@/components/game/traps/registry";
import TrapController from "@/components/game/traps/TrapController.vue";


const traps = computed(() => TRAPS_BY_MAP[currentMap] || []);


const userStore = useUserStore();

const isMafia = computed(() => userStore.myRole === "mafia");

const currentMap = "map2"; // позже можно брать из game / route

/* ----------------------------------
   Props
---------------------------------- */

const props = defineProps({
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

/**
 * 🔥 ВАЖНО: gameArea — ref и
 * provide ТОЛЬКО ОДИН РАЗ
 */
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
    const res = await fetch("/api/polygons/map2");
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
