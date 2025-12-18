<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <GameMap2 />

      <!-- RunnerPhysics с ref для управления игроком -->
      <RunnerPhysics
        ref="physicsPlayerRef"
        :game-area="gameArea"
        :polygons="polygons"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from "vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
import RunnerPhysics from "@/components/game/player/general/CurrentPlayer.vue";

const screenRef = ref(null);
const gameContentRef = ref(null);
const physicsPlayerRef = ref(null);

// Базовое разрешение
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

// Реактивный объект gameArea
const gameArea = ref({
  width: 0,
  height: 0,
  scale: 1,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  marginTop: 0,
  marginLeft: 0,
});

// Полигоны для физики
const polygons = ref([]);

// ======== Работа с полигонами ========
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
    // Привязываем центр хитбокса игрока к центру полигона
    physicsPlayerRef.value.pos.x = centerX - 12; // половина ширины хитбокса
    physicsPlayerRef.value.pos.y = centerY - 24; // половина высоты хитбокса
    physicsPlayerRef.value.velocity.y = 0;
  }
}

// ======== Масштабирование и ресайз ========
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


<!-- <template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <GameMap2 />
      <RunnerPhysics ref="physicsPlayerRef" :game-area="gameArea" />
    </div>
  </div>
</template> -->
<!-- 
<script setup>
import { ref, onMounted, onUnmounted, provide } from "vue";
// import GameMap1 from "@/components/game/maps/background/FirstMapBackground.vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
//import RunnerTest from "@/components/game/RunnerTest.vue";

import RunnerPhysics from "@/components/game/RunnerPhysicsEdited.vue";

const screenRef = ref(null);
const gameContentRef = ref(null);
//const runnerTestRef = ref(null);
const physicsPlayerRef = ref(null);

// Базовое (референсное) разрешение игры
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const gameArea = ref({
  width: 0,
  height: 0,
  scale: 1,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
});

// Дебаунс для ресайза
let resizeTimeout;

const updateScreenSize = () => {
  if (!screenRef.value || !gameContentRef.value) return;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Рассчитываем размеры для 16:9
  let gameWidth,
    gameHeight,
    marginTop = 0,
    marginLeft = 0;

  // Вариант 1: Высота больше ширины (узкое окно)
  if (windowWidth / windowHeight < 16 / 9) {
    // Ограничиваем по ширине, черные полосы сверху/снизу
    gameWidth = windowWidth;
    gameHeight = Math.round((gameWidth * 9) / 16);
    marginTop = (windowHeight - gameHeight) / 2;
  }
  // Вариант 2: Ширина больше высоты (широкое окно)
  else {
    // Ограничиваем по высоте, черные полосы по бокам
    gameHeight = windowHeight;
    gameWidth = Math.round((gameHeight * 16) / 9);
    marginLeft = (windowWidth - gameWidth) / 2;
  }

  // Устанавливаем размеры и отступы
  gameContentRef.value.style.width = `${gameWidth}px`;
  gameContentRef.value.style.height = `${gameHeight}px`;
  gameContentRef.value.style.marginTop = `${marginTop}px`;
  gameContentRef.value.style.marginLeft = `${marginLeft}px`;

  // Вычисляем масштаб (относительно базового размера)
  const scale = gameWidth / BASE_WIDTH;

  // Обновляем реактивные данные
  gameArea.value = {
    width: gameWidth,
    height: gameHeight,
    scale,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    marginTop,
    marginLeft,
  };

  // Передаем данные в RunnerTest
  // if (
  //   runnerTestRef.value &&
  //   typeof runnerTestRef.value.updateGameArea === "function"
  // ) {
  //   runnerTestRef.value.updateGameArea(gameArea.value);
  // }
  if (
    physicsPlayerRef.value &&
    typeof physicsPlayerRef.value.updateGameArea === "function"
  ) {
    physicsPlayerRef.value.updateGameArea(gameArea.value);
  }
};

// Обработчик ресайза с дебаунсом
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateScreenSize, 50); // 50мс дебаунс
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", handleResize);

  // Передаем gameArea через provide для вложенных компонентов
  provide("gameArea", gameArea);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  clearTimeout(resizeTimeout);
});

// Экспортируем методы для внешнего доступа
defineExpose({
  updateScreenSize,
  getGameArea: () => gameArea.value,
  getScale: () => gameArea.value.scale,
});
</script> -->

<!-- <style scoped>
.game-screen {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  background-color: #2c3e50; /* Черные полосы */
  overflow: hidden;
}

.game-content {
  position: relative;
  background-color: #2c3e50;
  transition: all 0.3s ease;
}
</style> -->
