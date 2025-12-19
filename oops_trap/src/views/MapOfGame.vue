<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <!-- Карта -->
      <GameMap2 />

      <!-- Ловушки: тип и активность передаем, позиции и картинки внутри TrapNum3 -->
      <TrapNum3
  v-for="trap in traps"
  :key="trap.id"
  :type="trap.type"
  :active="trap.active"
  :width="gameArea.width"
  :height="gameArea.height"
/>


      <!-- Игрок -->
      <RunnerPhysics ref="physicsPlayerRef" :game-area="gameArea" :polygons="polygons" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from "vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
import RunnerPhysics from "@/components/game/player/general/CurrentPlayer.vue";
import TrapNum3 from "@/components/game/traps/map2/TrapNum3.vue";

const screenRef = ref(null);
const gameContentRef = ref(null);
const physicsPlayerRef = ref(null);

// Базовое разрешение
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

// gameArea для масштабирования и позиционирования элементов
const gameArea = ref({
  width: 0,
  height: 0,
  scale: 1,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  marginTop: 0,
  marginLeft: 0,
});

// Полигоны для физики игрока
const polygons = ref([]);

// Ловушки — только тип и активность
const traps = ref([
  { id: 1, type: "poisonWater", active: true },
  { id: 2, type: "poisonWater", active: false },
]);

function handleTrapActivated(payload) {
  console.log("Trap activated:", payload);
}

// ======== Полигоны ========
async function fetchPolygons() {
  try {
    const res = await fetch("/api/polygons/map2");
    if (!res.ok) throw new Error("Failed to fetch polygons");
    const data = await res.json();
    polygons.value = data.polygons || [];
    spawnPlayerAtSpawn();
  } catch (err) {
    console.error("Error fetching polygons:", err);
  }
}

function spawnPlayerAtSpawn() {
  const spawnPoly = polygons.value.find((p) => p.type === "spawn");
  if (!spawnPoly || !spawnPoly.points.length) return;

  const pts = spawnPoly.points;
  const centerX = pts.reduce((acc, p) => acc + p.x, 0) / pts.length;
  const centerY = pts.reduce((acc, p) => acc + p.y, 0) / pts.length;

  if (physicsPlayerRef.value) {
    physicsPlayerRef.value.pos.x = centerX - 12;
    physicsPlayerRef.value.pos.y = centerY - 24;
    physicsPlayerRef.value.velocity.y = 0;
  }
}

// ======== Масштабирование ========
const updateScreenSize = () => {
  if (!screenRef.value || !gameContentRef.value) return;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let gameWidth, gameHeight, marginTop = 0, marginLeft = 0;

  if (windowWidth / windowHeight < 16 / 9) {
    gameWidth = windowWidth;
    gameHeight = Math.round((gameWidth * 9) / 16);
    marginTop = (windowHeight - gameHeight) / 2;
  } else {
    gameHeight = windowHeight;
    gameWidth = Math.round((gameHeight * 16) / 9);
    marginLeft = (windowWidth - gameWidth) / 2;
  }

  gameContentRef.value.style.width = `${gameWidth}px`;
  gameContentRef.value.style.height = `${gameHeight}px`;
  gameContentRef.value.style.marginTop = `${marginTop}px`;
  gameContentRef.value.style.marginLeft = `${marginLeft}px`;

  const scale = gameWidth / BASE_WIDTH;
  gameArea.value = { width: gameWidth, height: gameHeight, scale, baseWidth: BASE_WIDTH, baseHeight: BASE_HEIGHT, marginTop, marginLeft };
};

let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateScreenSize, 50);
};

// ======== Lifecycle ========
onMounted(() => {
  fetchPolygons();
  updateScreenSize();
  provide("gameArea", gameArea);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  clearTimeout(resizeTimeout);
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
}
</style>
