<!-- <template>
  <div class="game-container">
    <canvas ref="canvas" width="800" height="600"></canvas>

    <div class="hud">
      <p>Time left: {{ timeLeft }}</p>
    </div>

    <div v-if="gameEnded" class="overlay">
      <h2>Game Over</h2>
      <ul>
        <li v-for="stat in stats" :key="stat.userId">
          Player {{ stat.userId }} — {{ stat.score }} points
        </li>
      </ul>
      <button @click="exitToMenu">Exit</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const gameId = 1; // получить из маршрута
const userId = 2; // получить из auth

const ws = ref(null);
const timeLeft = ref(0);
const stats = ref([]);
const gameEnded = ref(false);

onMounted(() => {
  ws.value = new WebSocket("ws://localhost/ws/game");

  ws.value.onopen = () => {
    ws.value.send(JSON.stringify({ type: "join", gameId, userId }));
  };

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "GAME_START":
        timeLeft.value = data.payload.timeLeft;
        break;
      case "TICK":
        timeLeft.value = data.payload.timeLeft;
        break;
      case "GAME_END":
        stats.value = data.payload.stats;
        gameEnded.value = true;
        break;
    }
  };
});

onUnmounted(() => {
  ws.value?.close();
});

function exitToMenu() {
  ws.value?.close();
  window.location.href = "/lobbies";
}
</script> -->

<template>
  <div class="game-container">
    <canvas ref="canvas" width="800" height="600"></canvas>

    <div class="hud">
      <p>Time left: {{ timeLeft }}</p>
      <p>Game ID: {{ gameId }}</p>
      <p>User ID: {{ userId }}</p>
      <p v-if="lobbyId">Lobby ID: {{ lobbyId }}</p>
      <div class="hud-buttons">
        <button @click="showExitConfirm" class="exit-btn">Exit Game</button>
        <button @click="returnToLobby" class="lobby-btn" v-if="lobbyId">
          Return to Lobby
        </button>
      </div>
    </div>

    <div v-if="gameEnded" class="overlay">
      <h2>Game Over</h2>
      <ul>
        <li v-for="stat in stats" :key="stat.userId">
          Player {{ stat.userId }} — {{ stat.score }} points
        </li>
      </ul>
      <div class="overlay-buttons">
        <button @click="exitToMenu">Exit to Menu</button>
        <button @click="returnToLobby" v-if="lobbyId">Return to Lobby</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { Modal } from "ant-design-vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { userId: storeUserId } = storeToRefs(userStore);

// Получаем параметры из URL (без использования localStorage)
const gameId = computed(() => route.params.id || 1);
const userId = computed(() => storeUserId.value);
const lobbyId = computed(() => route.query.lobbyId); // Только из query параметров

const ws = ref(null);
const timeLeft = ref(0);
const stats = ref([]);
const gameEnded = ref(false);
const canvas = ref(null);

onMounted(() => {
  userStore.initializeUser();
  connectGameWebSocket();
  initializeGame();
});

onUnmounted(() => {
  disconnectWebSocket();
});

const connectGameWebSocket = () => {
  try {
    ws.value = new WebSocket("ws://localhost/ws/game");

    ws.value.onopen = () => {
      console.log("Connected to game WebSocket");
      ws.value.send(JSON.stringify({ 
        type: "JOIN_GAME", 
        gameId: gameId.value, 
        userId: userId.value,
        lobbyId: lobbyId.value
      }));
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.value.onerror = (error) => {
      console.error("Game WebSocket error:", error);
      Modal.error({
        title: "Connection Error",
        content: "Failed to connect to game server",
        okText: "OK",
      });
    };

    ws.value.onclose = (event) => {
      console.log("Game WebSocket disconnected:", event.code, event.reason);
      if (event.code !== 1000) {
        Modal.warning({
          title: "Connection Lost",
          content: "Game connection was lost",
          okText: "OK",
        });
      }
    };

  } catch (error) {
    console.error("Failed to connect WebSocket:", error);
    Modal.error({
      title: "Connection Failed",
      content: "Cannot connect to game server",
      okText: "OK",
    });
  }
};

const disconnectWebSocket = () => {
  if (ws.value) {
    // Отправляем сообщение о выходе перед закрытием
    if (ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: "PLAYER_LEFT",
        gameId: gameId.value,
        userId: userId.value,
        lobbyId: lobbyId.value
      }));
    }
    ws.value.close(1000, "User left game");
    ws.value = null;
  }
};

const handleWebSocketMessage = (data) => {
  console.log("Game WebSocket message:", data);

  switch (data.type) {
    case "GAME_START":
      timeLeft.value = data.payload.timeLeft;
      gameEnded.value = false;
      break;

    case "TICK":
      timeLeft.value = data.payload.timeLeft;
      break;

    case "GAME_END":
      stats.value = data.payload.stats || [];
      gameEnded.value = true;
      break;

    case "PLAYER_JOINED":
      console.log("Player joined game:", data.player);
      break;

    case "PLAYER_LEFT":
      console.log("Player left game:", data.playerId);
      break;

    case "GAME_STATE_UPDATE":
      // Обработка обновления состояния игры
      updateGameState(data.payload);
      break;

    case "LOBBY_INFO":
      // Сервер может прислать информацию о лобби, но не сохраняем в localStorage
      console.log("Lobby info received:", data.lobbyId);
      break;

    default:
      console.warn("Unknown game message type:", data.type);
  }
};

const initializeGame = () => {
  // Инициализация игровой логики и canvas
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    // Начальная отрисовка игрового поля
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }
};

const updateGameState = (gameState) => {
  // Обновление игрового состояния на основе данных от сервера
  if (canvas.value && gameState) {
    const ctx = canvas.value.getContext('2d');
    // Отрисовка обновленного состояния игры
    // Здесь должна быть ваша игровая логика
  }
};

const returnToLobby = () => {
  if (!lobbyId.value) {
    Modal.error({
      title: "Cannot Return to Lobby",
      content: "Lobby information is not available",
      okText: "OK",
    });
    return;
  }

  // Просто переходим обратно в лобби без проверок
  // Сервер сам решит, существует ли еще лобби
  disconnectWebSocket();
  router.push(`/lobby?id=${lobbyId.value}&mode=join`);
};

const showExitConfirm = () => {
  const content = lobbyId.value 
    ? "Exit to menu or return to lobby?" 
    : "Are you sure you want to exit the game? Your progress will be lost.";

  Modal.confirm({
    title: "Exit Game",
    content: content,
    okText: "Exit to Menu",
    cancelText: lobbyId.value ? "Return to Lobby" : "Cancel",
    okType: "danger",
    centered: true,
    onOk: () => {
      exitToMenu();
    },
    onCancel: () => {
      if (lobbyId.value) {
        returnToLobby();
      }
    }
  });
};

const exitToMenu = () => {
  disconnectWebSocket();
  router.push("/createLobby");
};

// Обработка закрытия страницы
window.addEventListener('beforeunload', () => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: "PLAYER_LEFT",
      gameId: gameId.value,
      userId: userId.value,
      lobbyId: lobbyId.value
    }));
  }
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #1a1a1a;
  overflow: hidden;
}

canvas {
  display: block;
  margin: 0 auto;
  background-color: #2c3e50;
}

.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-family: 'Arial', sans-serif;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 10px;
  min-width: 220px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hud p {
  margin: 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.hud-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.exit-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.lobby-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.exit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.lobby-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(44, 62, 80, 0.95), rgba(52, 73, 94, 0.95));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'Arial', sans-serif;
  z-index: 1000;
}

.overlay h2 {
  font-size: 42px;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  background: linear-gradient(135deg, #3498db, #2ecc71);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.overlay ul {
  list-style: none;
  padding: 0;
  margin-bottom: 30px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  min-width: 300px;
}

.overlay li {
  font-size: 18px;
  margin: 12px 0;
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.overlay-buttons {
  display: flex;
  gap: 20px;
}

.overlay button {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.overlay button:first-child {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.overlay button:last-child {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.overlay button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}
</style>