<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <!-- Фон -->
      <GameMap2 />
      <!-- Контроллер -->
      <div class="trap-controller-wrapper">
        <TrapController v-if="isMafia" :traps="traps" @activate="onTrapActivate" />
      </div>
      <!-- Ловушки -->
      <component
        :is="trap.component"
        v-for="trap in traps"
        :key="trap.id"
        :active="trapsState[trap.name]"
      />

      <!-- Другие игроки -->
      <OtherPlayers :players="otherPlayers" />

      <!-- Текущий игрок -->
      <RunnerPhysics
        v-if="!isMafia"
        ref="physicsPlayerRef"
        :game-area="gameArea"
        :polygons="polygons"
        @player-move="handlePlayerMove"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, reactive, watchEffect } from "vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
import RunnerPhysics from "@/components/game/player/general/CurrentPlayer.vue";
import OtherPlayers from "@/components/game/player/general/OtherPlayer.vue";
import { computed } from "vue";
import { useUserStore } from "@/stores/user";
import { TRAPS_BY_MAP } from "@/components/game/traps/registry";
import TrapController from "@/components/game/traps/TrapController.vue";

const traps = computed(() => TRAPS_BY_MAP[currentMap] || []);
const trapsState = reactive({});

watchEffect(() => {
  traps.value.forEach(trap => {
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

const userStore = useUserStore();

const isMafia = computed(() => userStore.myRole === "mafia");

const currentMap = "map2"; // позже можно брать из game / route

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

function preloadImages(urls) {
  urls.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
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
  preloadImages([
    new URL("@/assets/images/maps/Map2/tr1/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr2/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr2/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr3/1.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr3/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr3/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr3/4.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr3/5.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr4/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr4/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr4/4.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr5/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr5/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/4.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/5.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/7.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/8.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/9.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr6/10.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr7/1.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr7/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr7/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr7/4.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr8/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr8/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr8/4.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr9/2.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr9/3.png", import.meta.url).href,
    new URL("@/assets/images/maps/Map2/tr10/1.png", import.meta.url).href,
  ]);
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
