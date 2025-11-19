<template>
  <div class="game-container">
    <canvas ref="canvas" width="800" height="600"></canvas>

    <div class="hud">
      <p>Time left: {{ timeLeft }}</p>
      <p>Game ID: {{ gameId }}</p>
      <p>User ID: {{ userId }}</p>
      <p v-if="lobbyId">Lobby ID: {{ lobbyId }}</p>
      <p>Connection: {{ connectionStatus }}</p>
      <div class="hud-buttons">
        <button @click="showExitConfirm" class="exit-btn">Exit Game</button>
        <button @click="returnToLobby" class="lobby-btn" v-if="lobbyId">
          Return to Lobby
        </button>
        <button @click="reconnect" class="reconnect-btn" v-if="!isConnected">
          Reconnect
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

    <div v-if="connectionError" class="error-overlay">
      <div class="error-content">
        <h3>Connection Error</h3>
        <p>{{ connectionError }}</p>
        <button @click="reconnect" class="reconnect-btn">Try to Reconnect</button>
        <button @click="exitToMenu" class="exit-btn">Exit to Menu</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { Modal } from "ant-design-vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { userId: storeUserId, getGameSocket, isInGame, currentGameId } = storeToRefs(userStore);

const gameId = computed(() => route.params.id || currentGameId.value || 1);
const userId = computed(() => storeUserId.value);
const lobbyId = computed(() => route.query.lobbyId);

const timeLeft = ref(0);
const stats = ref([]);
const gameEnded = ref(false);
const canvas = ref(null);
const connectionError = ref(null);
const isConnected = ref(false);

const connectionStatus = computed(() => {
  if (connectionError.value) return 'Disconnected';
  return isConnected.value ? 'Connected' : 'Connecting...';
});

onMounted(() => {
  userStore.initializeUser();
  connectGameWebSocket();
  initializeGame();
});

onUnmounted(() => {
  // Не закрываем сокет полностью, только удаляем обработчики
  // чтобы соединение можно было переиспользовать
  cleanupWebSocketHandlers();
});

// Отслеживаем изменения состояния подключения
watch(getGameSocket, (newSocket, oldSocket) => {
  if (newSocket !== oldSocket) {
    setupWebSocketHandlers(newSocket);
  }
});

const connectGameWebSocket = async () => {
  try {
    connectionError.value = null;
    isConnected.value = false;

    // Проверяем, есть ли уже активное соединение
    const existingSocket = getGameSocket.value;
    
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      console.log("✅ Reusing existing game WebSocket connection");
      setupWebSocketHandlers(existingSocket);
      isConnected.value = true;
      
      // Уведомляем сервер о том, что мы перешли на страницу игры
      userStore.sendGameMessage({
        type: "PLAYER_JOINED_GAME_PAGE",
        gameId: gameId.value,
        userId: userId.value,
        lobbyId: lobbyId.value
      });
      
    } else {
      console.log("🔄 Creating new game WebSocket connection");
      
      // Создаем новое соединение через userStore
      await userStore.createGameSocketConnection(gameId.value, lobbyId.value);
      
      const newSocket = getGameSocket.value;
      if (newSocket) {
        setupWebSocketHandlers(newSocket);
        
        // Ждем открытия соединения
        if (newSocket.readyState === WebSocket.OPEN) {
          isConnected.value = true;
        }
      }
    }

  } catch (error) {
    console.error("❌ Failed to connect game WebSocket:", error);
    connectionError.value = error.message;
    Modal.error({
      title: "Connection Failed",
      content: "Cannot connect to game server: " + error.message,
      okText: "OK",
    });
  }
};

const setupWebSocketHandlers = (socket) => {
  if (!socket) return;

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  socket.onopen = () => {
    console.log("✅ Game WebSocket connected");
    isConnected.value = true;
    connectionError.value = null;
  };

  socket.onerror = (error) => {
    console.error("❌ Game WebSocket error:", error);
    connectionError.value = "Connection error occurred";
    isConnected.value = false;
  };

  socket.onclose = (event) => {
    console.log("🔌 Game WebSocket disconnected:", event.code, event.reason);
    isConnected.value = false;
    
    if (event.code !== 1000 && !gameEnded.value) {
      connectionError.value = `Connection lost: ${event.reason || 'Unknown reason'}`;
    }
  };
};

const cleanupWebSocketHandlers = () => {
  const socket = getGameSocket.value;
  if (socket) {
    // Удаляем только наши обработчики, не закрывая соединение
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  }
};

const handleWebSocketMessage = (data) => {
  console.log("🎮 Game WebSocket message:", data);

  switch (data.type) {
    case "GAME_START":
      timeLeft.value = data.payload?.timeLeft || data.timeLeft || 0;
      gameEnded.value = false;
      connectionError.value = null;
      break;

    case "TICK":
      timeLeft.value = data.payload?.timeLeft || data.timeLeft || 0;
      break;

    case "GAME_END":
      stats.value = data.payload?.stats || data.stats || [];
      gameEnded.value = true;
      break;

    case "PLAYER_JOINED":
      console.log("👤 Player joined game:", data.player);
      break;

    case "PLAYER_LEFT":
      console.log("🚪 Player left game:", data.playerId);
      break;

    case "GAME_STATE_UPDATE":
      updateGameState(data.payload || data);
      break;

    case "connection-established":
      console.log("✅ WebSocket connection confirmed");
      isConnected.value = true;
      connectionError.value = null;
      break;

    case "waiting-start":
      console.log("⏳ Waiting for players:", data.message);
      break;

    case "player-connected":
      console.log(`👤 Player ${data.playerId} connected`);
      break;

    case "player-disconnected":
      console.log(`🚪 Player ${data.playerId} disconnected`);
      break;

    case "error":
      console.error("❌ Game server error:", data.message);
      Modal.error({
        title: "Game Error",
        content: data.message,
        okText: "OK",
      });
      break;

    default:
      console.warn("Unknown game message type:", data.type, data);
  }
};

const initializeGame = () => {
  // Инициализация игровой логики и canvas
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    // Начальная отрисовка игрового поля
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Добавьте здесь вашу игровую логику
    // Например: обработку ввода, игровую механику и т.д.
  }
};

const updateGameState = (gameState) => {
  // Обновление игрового состояния на основе данных от сервера
  if (canvas.value && gameState) {
    const ctx = canvas.value.getContext('2d');
    
    // Очистка canvas
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Отрисовка обновленного состояния игры
    // Здесь должна быть ваша игровая логика отрисовки
    // Например: игроки, объекты, карта и т.д.
    
    if (gameState.players) {
      gameState.players.forEach(player => {
        ctx.fillStyle = player.color || '#ffffff';
        ctx.fillRect(player.x || 50, player.y || 50, 30, 30);
      });
    }
  }
};

const reconnect = async () => {
  console.log("🔄 Attempting to reconnect...");
  connectionError.value = null;
  await connectGameWebSocket();
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

  // Не закрываем сокет - он может пригодиться при возврате в игру
  cleanupWebSocketHandlers();
  
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
  // Полностью закрываем игровое соединение при выходе в меню
  userStore.closeGameSocket();
  router.push("/createLobby");
};

// Обработка закрытия страницы
window.addEventListener('beforeunload', () => {
  if (isInGame.value) {
    userStore.sendGameMessage({
      type: "PLAYER_LEFT",
      gameId: gameId.value,
      userId: userId.value,
      lobbyId: lobbyId.value,
      reason: "page_unload"
    });
  }
});

// Обработка видимости страницы (для паузы при переключении вкладок)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && isInGame.value) {
    userStore.sendGameMessage({
      type: "PLAYER_AFK",
      gameId: gameId.value,
      userId: userId.value,
      afk: true
    });
  } else if (!document.hidden && isInGame.value) {
    userStore.sendGameMessage({
      type: "PLAYER_AFK",
      gameId: gameId.value,
      userId: userId.value,
      afk: false
    });
  }
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
}

.hud-buttons {
  margin-top: 10px;
}

.hud-buttons button {
  margin-right: 5px;
  padding: 5px 10px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-content {
  text-align: center;
  background: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #ff4444;
}

.reconnect-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
}

.reconnect-btn:hover {
  background: #45a049;
}

.exit-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
}

.exit-btn:hover {
  background: #cc0000;
}

.lobby-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
}

.lobby-btn:hover {
  background: #0b7dda;
}
</style>

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