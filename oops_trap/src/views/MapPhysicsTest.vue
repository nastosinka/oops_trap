<template>
  <div ref="screenRef" class="game-screen">
    <div ref="gameContentRef" class="game-content">
      <GameMap2 />

      <!-- RunnerPhysics с ref для управления спавном -->
      <RunnerPhysics
        ref="physicsPlayerRef"
        :game-area="gameArea"
        :polygons="polygons"
      />

      <!-- Canvas для отображения полигонов -->
      <canvas ref="polygonCanvas" class="polygon-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from "vue";
import GameMap2 from "@/components/game/maps/background/SecondMapBackground.vue";
import RunnerPhysics from "../components/game/RunnerPhysicsEdited.vue";

const screenRef = ref(null);
const gameContentRef = ref(null);
const physicsPlayerRef = ref(null);
const polygonCanvas = ref(null);

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

const polygons = ref([]);

async function fetchPolygons() {
  try {
    const res = await fetch("/api/polygons/map2");
    if (!res.ok) throw new Error("Failed to fetch polygons");

    const data = await res.json();
    polygons.value = data.polygons || [];

    drawPolygons();
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
    // Привязываем центр спрайта игрока к центру полигона
    physicsPlayerRef.value.pos.x = centerX - 32; // 32 = половина ширины спрайта
    physicsPlayerRef.value.pos.y = centerY - 64; // 64 = высота спрайта
  }
}

function resizePolygonCanvas() {
  const canvas = polygonCanvas.value;
  if (!canvas) return;
  canvas.width = gameArea.value.width;
  canvas.height = gameArea.value.height;
  drawPolygons();
}

function drawPolygons() {
  const canvas = polygonCanvas.value;
  if (!canvas || polygons.value.length === 0) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  polygons.value.forEach((poly) => {
    if (!poly.points.length) return;

    ctx.beginPath();
    ctx.moveTo(
      poly.points[0].x * gameArea.value.scale,
      poly.points[0].y * gameArea.value.scale
    );
    for (let i = 1; i < poly.points.length; i++) {
      const p = poly.points[i];
      ctx.lineTo(p.x * gameArea.value.scale, p.y * gameArea.value.scale);
    }
    ctx.closePath();

    if (poly.type === "boundary") {
      ctx.fillStyle = "rgba(255,0,0,0.2)";
      ctx.strokeStyle = "red";
    } else {
      ctx.fillStyle = "rgba(0,255,0,0.2)";
      ctx.strokeStyle = "lime";
    }

    ctx.fill();
    ctx.stroke();

    // Красная точка в центре полигона spawn
    if (poly.type === "spawn") {
      const cX =
        poly.points.reduce((acc, p) => acc + p.x, 0) / poly.points.length;
      const cY =
        poly.points.reduce((acc, p) => acc + p.y, 0) / poly.points.length;
      ctx.beginPath();
      ctx.arc(
        cX * gameArea.value.scale,
        cY * gameArea.value.scale,
        10,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });
}

const updateScreenSize = () => {
  if (!screenRef.value || !gameContentRef.value) return;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let gameWidth,
    gameHeight,
    marginTop = 0,
    marginLeft = 0;

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

  gameArea.value = {
    width: gameWidth,
    height: gameHeight,
    scale,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    marginTop,
    marginLeft,
  };

  resizePolygonCanvas();
};

let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateScreenSize, 50);
};

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
  background-color: #2c3e50;
  overflow: hidden;
}

.game-content {
  position: relative;
}

.polygon-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
}
</style>
