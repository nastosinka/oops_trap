<template>
  <!-- Загрузочный экран -->
  <div v-if="showSplash" class="splash-screen">
    <img :src="playerImage" class="splash-image" />
  </div>

  <!-- Основная часть игры -->
  <div v-else class="game-container">
    <div class="game-container">
      <!-- HUD с информацией об игре -->
      <div class="hud">
        <div class="hud-info">
          <p>Time left: {{ timeLeft }}s</p>
          <p>
            <VolumeControl />
          </p>
        </div>
      </div>

      <!-- Игровая карта -->
      <div class="container">
        <MapOfGame ref="mapRef" :other-players="otherPlayers" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import MapOfGame from "@/components/game/maps/MapOfGame.vue";
import runnerImg from "@/assets/images/1_R.png";
import mafiaImg from "@/assets/images/1_T.png";
import { useGameResultsStore } from "@/stores/gameResults";
import { audioManager } from "@/utils/audioManager";
import gameMusic from "@/assets/music/game-music.mp3";
import stepsSound from "@/assets/music/steps.mp3";
import VolumeControl from "@/components/base/VolumeControl.vue";

const resultsStore = useGameResultsStore();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const {
  userId: storeUserId,
  getGameSocket,
  currentGameId,
} = storeToRefs(userStore);

const showSplash = ref(true);

/* ------------------------------------------------------------------
   Реактивные данные и computed значения
-------------------------------------------------------------------*/
const myRole = computed(() => userStore.myRole);

const isAlive = computed(() => userStore.isAlive);

const playerImage = computed(() =>
  myRole.value === "mafia" ? mafiaImg : runnerImg
);

const allPlayers = ref([]);

// Идентификатор текущей игры
const gameId = computed(() => route.params.id || currentGameId.value || 1);

// Идентификатор пользователя
const userId = computed(() => storeUserId.value);

// Идентификатор лобби (если есть)
const lobbyId = computed(() => route.query.lobbyId);

// Флаг: является ли пользователь хостом
const isHost = ref(false);

// Координаты текущего игрока
const playerCoords = reactive({ x: 0, y: 0 });

// Список других игроков на карте
const otherPlayers = ref([]);

// Состояние таймера
const timeLeft = ref(0);
const timerActive = ref(false);

// Состояние соединения
const isConnected = ref(false);
const connectionError = ref(null);

// Флаг завершения игры
const gameEnded = ref(false);

// Ref для доступа к компоненту карты
const mapRef = ref(null);

//ТУТ НАЧИНАЕТСЯ АУДИО

const MAX_STEP_DISTANCE = 20000; // радиус слышимости шагов

function calcStepVolume(player, enemy) {
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= MAX_STEP_DISTANCE) return 0;

  // линейное затухание
  return 1 - distance / MAX_STEP_DISTANCE;
}

//ТУТ ЗАКАНЧИВАЕТСЯ АУДИО

/* ------------------------------------------------------------------
   Работа с координатами игрока
-------------------------------------------------------------------*/

/**
 * Отправляет текущие координаты игрока на сервер по WebSocket.
 *
 * @param {number} x - координата X
 * @param {number} y - координата Y
 * @param {number} lastImage - идентификатор последнего спрайта
 */
const sendPlayerMove = (x, y, lastImage = 1) => {
  if (!isAlive.value) return;
  const socket = getGameSocket.value;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "player_move",
      gameId: gameId.value,
      playerId: userId.value,
      settings: { x, y, lastImage },
    })
  );
};

const sendTrapMove = (trap) => {
  const socket = getGameSocket.value;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(
    JSON.stringify({
      type: "trap_message",
      gameId: gameId.value,
      playerId: userId.value,
      trap,
    })
  );
};

/**
 * Обрабатывает входящее сообщение об активации ловушки
 */
function handleIncomingTrap(message) {
  // Определяем имя ловушки из сообщения
  const trapName = message.name || message.trap;

  if (!trapName) {
    console.error("Trap message missing trap name:", message);
    return;
  }

  // Проверяем, не наш ли это собственный триггер ловушки
  if (message.playerId && message.playerId === userId.value) {
    console.log("Ignoring own trap activation:", trapName);
    return; // Игнорируем свои же сообщения
  }

  console.log("Activating trap from server:", trapName);

  if (mapRef.value && mapRef.value.onTrapActivate) {
    mapRef.value.onTrapActivate({ name: trapName });
  }
}

/**
 * Обрабатывает входящее сообщение о деактивации ловушки
 */
function handleTrapDeactivation(message) {
  const trapName = message.name || message.trap;

  if (!trapName) {
    console.error("Trap deactivation message missing trap name:", message);
    return;
  }

  console.log("Deactivating trap from server:", trapName);

  if (mapRef.value && mapRef.value.onTrapDisactive) {
    mapRef.value.onTrapDisactive({ name: trapName });
  }
}

/**
 * Подписывается на глобальное событие обновления координат игрока,
 * которое отправляется из компонента карты.
 */
function setupCoordsListener() {
  window.addEventListener("player-coords-update", playerCoordsHandler);
  window.addEventListener("player-traps-update", trapHandler);
}

function cleanupCoordsListener() {
  window.removeEventListener("player-coords-update", playerCoordsHandler);
  window.removeEventListener("player-traps-update", trapHandler);
}

const playerCoordsHandler = (event) => {
  const newCoords = event.detail;
  playerCoords.x = newCoords.x;
  playerCoords.y = newCoords.y;
  sendPlayerMove(playerCoords.x, playerCoords.y, newCoords.lastImage || 1);
};

const trapHandler = (event) => {
  const trap = event.detail;
  sendTrapMove(trap);
};

/* ------------------------------------------------------------------
   Жизненный цикл компонента
-------------------------------------------------------------------*/

onMounted(async () => {
  // Загружаем аудио
  await audioManager.load("game", gameMusic);
  await audioManager.load("steps", stepsSound);

  // Сразу запускаем музыку, без unlock
  // Если браузер блокирует, тогда повесим fallback на клик
  try {
    // Если сейчас играет что-то (background), плавно убавим
    audioManager.fadeOutMusic(1.2); // затухание 1.2 секунды
    // Ждём окончания fade-out
    setTimeout(() => {
      audioManager.playMusic("game", { loop: true, volume: 0.15 });
    }, 1200);
  } catch {
    const unlock = async () => {
      await audioManager.unlock();
      audioManager.playMusic("game", { loop: true, volume: 0.15 });
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
  }

  userStore.initializeUser();
  userStore.setIsAlive(true);

  await checkIfUserIsHost();
  setupGameWebSocket();
  setupCoordsListener();

  // Начальная позиция игрока
  playerCoords.x = 1850;
  playerCoords.y = 950;
  sendPlayerMove(playerCoords.x, playerCoords.y, 1);
});

onUnmounted(() => {
  cleanupWebSocket();
  cleanupCoordsListener();
});

/* ------------------------------------------------------------------
   Лобби и навигация
-------------------------------------------------------------------*/

/**
 * Проверяет, является ли текущий пользователь хостом лобби.
 */
const checkIfUserIsHost = async () => {
  if (!lobbyId.value) {
    isHost.value = false;
    return;
  }

  try {
    const response = await fetch(
      `/api/lobby/lobbies/${lobbyId.value}/settings`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.success && data.data) {
      isHost.value = data.data.ownerId === userId.value;
    }
  } catch (error) {
    console.error("Error checking host status:", error);
    isHost.value = false;
  }
};

/* ------------------------------------------------------------------
   WebSocket и обработка сообщений игры
-------------------------------------------------------------------*/

/**
 * Инициализирует WebSocket для игры и навешивает обработчики событий.
 */
const setupGameWebSocket = () => {
  const socket = getGameSocket.value;

  if (!socket) {
    connectionError.value = "No game connection";
    return;
  }

  isConnected.value = socket.readyState === WebSocket.OPEN;

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleGameMessage(message);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  socket.onclose = (event) => {
    isConnected.value = false;
    if (!event.wasClean) {
      connectionError.value =
        event.reason || "Connection was lost unexpectedly";
    }
  };

  socket.onerror = () => {
    connectionError.value = "Connection error";
  };

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "init",
        gameId: gameId.value,
        playerId: userId.value,
        isHost: isHost.value,
      })
    );
  }
};

/**
 * Сбрасывает состояние соединения при уничтожении компонента.
 */
const cleanupWebSocket = () => {
  isConnected.value = false;
};

const STEP_DISTANCE = 40; // сколько пикселей = 1 шаг
const stepProgressByPlayer = new Map();
const lastEnemyPositions = new Map();

/**
 * Обрабатывает входящие сообщения от игрового сервера.
 *
 * @param {Object} message - сообщение WebSocket
 */
const handleGameMessage = (message) => {
  switch (message.type) {
    case "timer_started":
      showSplash.value = false;
      timerActive.value = true;
      timeLeft.value = message.timeLeft;
      break;

    case "timer_update":
      timerActive.value = message.active;
      timeLeft.value = message.timeLeft;
      break;

    case "trap_message":
      console.log("Trap message received:", message);
      if (message.result) {
        handleIncomingTrap(message);
      } else {
        handleTrapDeactivation(message);
      }
      break;

    case "player_move":
      if (Array.isArray(message.coords)) {
        const normalized = message.coords.map((player) => {
          const isTrapper =
            player.trapper === true || player.trapper === "true";

          return {
            id: String(player.fid || player.id),
            name: player.name || `Player ${player.fid || player.id}`,
            x: Number(player.x) || 100,
            y: Number(player.y) || 100,
            lastImage: Number(player.lastImage) || 1,
            isHost: Boolean(player.isHost),
            trapper: isTrapper,
            alive: player.alive,
          };
        });

        otherPlayers.value = normalized.filter(
          (p) =>
            p.id !== String(userId.value) &&
            p.trapper === false &&
            p.alive === true
        );


        otherPlayers.value.forEach((enemy) => {
          const prev = lastEnemyPositions.get(enemy.id);

          lastEnemyPositions.set(enemy.id, { x: enemy.x, y: enemy.y });

          if (!prev) return;

          const dx = enemy.x - prev.x;
          const dy = enemy.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1) return;

          const acc = (stepProgressByPlayer.get(enemy.id) || 0) + dist;

          if (acc < STEP_DISTANCE) {
            stepProgressByPlayer.set(enemy.id, acc);
            return;
          }

          stepProgressByPlayer.set(enemy.id, acc % STEP_DISTANCE);

          const volume = calcStepVolume(playerCoords, enemy);
          if (volume <= 0.05) return;

          const pitch = 0.9 + Math.random() * 0.2;
          const gain = volume * (0.5 + Math.random() * 0.2);

          audioManager.playSfx("steps", {
            volume: gain,
            playbackRate: pitch,
          });
        });

        allPlayers.value = normalized.filter(
          (p) => p.id !== String(userId.value)
        );

        const me = normalized.find((p) => p.id === String(userId.value));

        if (me) {
          playerCoords.x = me.x;
          playerCoords.y = me.y;
        }
      }
      break;

    case "rollback":
      if (message.playerId === userId.value) {
        playerCoords.x = message.x;
        playerCoords.y = message.y;
        sendPlayerMove(playerCoords.x, playerCoords.y, 1);
      }
      break;

    case "player_disconnected":
      otherPlayers.value = otherPlayers.value.filter(
        (p) => p.id !== String(message.playerId)
      );
      allPlayers.value = allPlayers.value.filter(
        (p) => p.id !== String(message.playerId)
      );
      break;

    case "died":
      if (String(message.playerId) === String(userId.value)) {
        userStore.setIsAlive(false);
      }

      otherPlayers.value = otherPlayers.value.filter(
        (p) => p.id !== String(message.playerId)
      );
      allPlayers.value = allPlayers.value.map((p) =>
        p.id === String(message.playerId) ? { ...p, alive: false } : p
      );
      break;

    case "all_stats":
      {
        audioManager.fadeOutMusic(1.2);

        setTimeout(() => {
          audioManager.playMusic("background", {
            loop: true,
            volume: 0.3,
          });
        }, 1200);

        if (!message.stats) return;

        const results = Object.entries(message.stats).map(([id, stat]) => ({
          id: String(id),
          name: stat.name,
          role: stat.role,
          win: stat.win,
          time: stat.time,
          map: stat.map,
        }));

        resultsStore.setResults(results, results[0]?.map ?? null);

        gameEnded.value = true;
        timerActive.value = false;

        router.push({
          path: "/results",
          query: {
            lobbyId: lobbyId.value,
          },
        });
      }
      break;

    default:
      break;
  }
};
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  background: rgb(48, 62, 78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.splash-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
}

.chat {
  border: 1px solid #ccc;
  padding: 10px;
  height: 300px;
  overflow-y: scroll;
  margin: 10px 0;
}

.chat-message {
  margin-bottom: 8px;
  padding: 4px;
}

.timestamp {
  font-size: 0.8em;
  color: #666;
  margin-right: 8px;
}

.player {
  font-weight: bold;
  margin-right: 4px;
}

.player.host {
  color: #ff6b35;
}

.text {
  word-break: break-word;
}

.input-group {
  display: flex;
  gap: 10px;
}

input,
button {
  padding: 8px;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lobby-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f0f0f0;
  color: #999;
}

.lobby-btn:disabled:hover {
  background-color: #f0f0f0;
}

.status-connected {
  color: green;
  font-weight: bold;
}

.status-disconnected {
  color: red;
  font-weight: bold;
}

.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
  overflow: hidden;
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 8px;
  min-width: 200px;
  border: 1px solid #333;
  z-index: 50;
}

.hud-info p {
  margin: 5px 0;
  font-size: 14px;
  font-family: "Irish Grover", system-ui;
  font-size: 20px;
  color: #ffcc00;
}

/* .hud-buttons {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hud-buttons button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.exit-btn {
  background: #ff4444;
  color: white;
}

.exit-btn:hover {
  background: #cc0000;
}

.lobby-btn {
  background: #2196f3;
  color: white;
}

.lobby-btn:hover {
  background: #0b7dda;
}

.reconnect-btn {
  background: #4caf50;
  color: white;
}

.reconnect-btn:hover {
  background: #45a049;
}

.status-connected {
  color: #4caf50;
}

.status-disconnected {
  color: #ff4444;
}

.status-waiting {
  color: #ff9800;
} */

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.game-results {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 10px;
  border: 2px solid #444;
  text-align: center;
  min-width: 300px;
}

.game-results h2 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 24px;
}

.results-list {
  margin: 20px 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background: #333;
  border-radius: 5px;
  border-left: 4px solid #666;
}

.result-item .winner {
  border-left-color: #4caf50;
  background: #2d4a2d;
}

.player-name {
  font-weight: bold;
}

.player-score {
  color: #ffd166;
}

.player-result.winner {
  color: #4caf50;
  font-weight: bold;
}

.overlay-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.error-content {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 10px;
  border: 2px solid #ff4444;
  text-align: center;
  max-width: 400px;
}

.error-content h3 {
  color: #ff4444;
  margin-bottom: 15px;
}

.error-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.waiting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 15;
}

.waiting-content {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 10px;
  border: 2px solid #ff9800;
  text-align: center;
}

.waiting-content h3 {
  color: #ff9800;
  margin-bottom: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #ff9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

.coord-controls {
  margin-top: 10px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.coord-controls button {
  padding: 5px 8px;
  font-size: 12px;
  cursor: pointer;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
