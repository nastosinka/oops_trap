<template>
  <div class="game-container">
    <div class="hud">
      <div class="hud-info">
        <p>Time left: {{ timeLeft }}s</p>
        <p>Game ID: {{ gameId }}</p>
        <p>User ID: {{ userId }}</p>
        <p v-if="lobbyId">Lobby ID: {{ lobbyId }}</p>
        <p>Role: {{ isHost ? "Host" : "Player" }}</p>
        <p>
          Connection:
          <span :class="connectionStatusClass">{{ connectionStatus }}</span>
        </p>
      </div>
      <div class="hud-buttons">
        <button v-if="lobbyId" class="lobby-btn" @click="returnToLobby">
          Return to Lobby
        </button>
      </div>
    </div>
    <div class="container">
      <div id="chat" class="chat"></div>

      <div class="input-group">
        <input type="text" id="messageInput" placeholder="Сообщение" onkeypress="handleKeyPress(event)">
        <button onclick="sendMessage()">Отправить</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { Modal } from "ant-design-vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const {
  userId: storeUserId,
  getGameSocket,
  currentGameId,
} = storeToRefs(userStore);

// реактивные данные, но никак не связаны с сокетами
const gameId = computed(() => route.params.id || currentGameId.value || 1);
const userId = computed(() => storeUserId.value);
const lobbyId = computed(() => route.query.lobbyId);
const isHost = ref(false); // Будет установлено после проверки

// тут создаём реактивные данные (не в дате6 потому что будем ими пуляться в пинию)
const timeLeft = ref(0);
const isConnected = ref(false);
const stats = ref([]);
const gameEnded = ref(false);
const connectionError = ref(null);
const waitingForPlayers = ref(false);
const connectedPlayersCount = ref(0);
const totalPlayersCount = ref(0);

// Connection status
const connectionStatus = computed(() => {
  if (connectionError.value) return "Disconnected";
  if (waitingForPlayers.value) return "Waiting";
  return isConnected.value ? "Connected" : "Connecting...";
});

const connectionStatusClass = computed(() => {
  return {
    "status-connected": isConnected.value,
    "status-disconnected": connectionError.value,
    "status-waiting": waitingForPlayers.value,
  };
});

onMounted(async () => {
  userStore.initializeUser();

  // Проверяем, является ли пользователь хостом
  await checkIfUserIsHost();

  connectGameWebSocket();
});

onUnmounted(() => {
  userStore.clearGameState();
});

// Watch for socket changes
watch(getGameSocket, (newSocket, oldSocket) => {
  if (newSocket !== oldSocket) {
    setupWebSocketHandlers(newSocket);
  }
});

// Проверяем, является ли пользователь хостом лобби
const checkIfUserIsHost = async () => {
  if (!lobbyId.value) {
    isHost.value = false;
    return;
  }

  try {
    const response = await fetch(
      `/api/lobby/lobbies/${lobbyId.value}/settings`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data) {
      isHost.value = data.data.ownerId === userId.value;
      console.log(
        `🎮 User is ${isHost.value ? "HOST" : "PLAYER"} of lobby ${lobbyId.value
        }`
      );
    } else {
      isHost.value = false;
    }
  } catch (error) {
    console.error("❌ Error checking host status:", error);
    isHost.value = false;
  }
};

const returnToLobby = async () => {
  if (!lobbyId.value) {
    Modal.error({
      title: "Cannot Return to Lobby",
      content: "Lobby information is not available",
      okText: "OK",
    });
    return;
  }

  try {
    if (isHost.value) {
      // Если хост - обновляем статус лобби на 'waiting'
      await updateLobbyStatus("waiting");
      console.log("🎮 Host returned to lobby, status set to waiting");
    } else {
      console.log("🎮 Player returned to lobby");
    }
  } catch (error) {
    console.error("❌ Error updating lobby status:", error);
    // Продолжаем в любом случае
  }
  router.push(`/lobby?id=${lobbyId.value}&mode=join`);
};

const updateLobbyStatus = async (newStatus) => {
  try {
    const response = await fetch(`/api/lobby/lobbies/${lobbyId.value}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerId: userId.value,
        newStatus,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error updating lobby status:", error);
    throw error;
  }
};





















// веб сокетыыыыы

const connectGameWebSocket = async () => {
  try {
    connectionError.value = null;
    isConnected.value = false;
    waitingForPlayers.value = false;

    const existingSocket = getGameSocket.value;

    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      console.log("✅ Reusing existing game WebSocket connection");
      setupWebSocketHandlers(existingSocket);
      isConnected.value = true;

      userStore.sendGameMessage({
        type: "PLAYER_JOINED_GAME_PAGE",
        gameId: gameId.value,
        userId: userId.value,
        lobbyId: lobbyId.value,
        isHost: isHost.value,
      });
    } else {
      console.log("🔄 Creating new game WebSocket connection");

      const newSocket = getGameSocket.value;
      if (newSocket) {
        setupWebSocketHandlers(newSocket);

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

    // Send initial join message
    userStore.sendGameMessage({
      type: "PLAYER_JOINED_GAME_PAGE",
      gameId: gameId.value,
      userId: userId.value,
      lobbyId: lobbyId.value,
      isHost: isHost.value,
    });
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
      connectionError.value = `Connection lost: ${event.reason || "Unknown reason"
        }`;
    }
  };
};

const cleanupWebSocketHandlers = () => {
  const socket = getGameSocket.value;
  if (socket) {
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
      waitingForPlayers.value = false;
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
      waitingForPlayers.value = true;
      connectedPlayersCount.value = data.connectedPlayers?.length || 0;
      totalPlayersCount.value = data.totalPlayers || 0;
      break;

    case "player-connected":
      console.log(`👤 Player ${data.playerId} connected`);
      break;

    case "player-disconnected":
      console.log(`🚪 Player ${data.playerId} disconnected`);
      break;

    case "player-ready":
      console.log(`✅ Player ${data.playerId} is ready`);
      break;

    case "reconnect-success":
      console.log("✅ Reconnected successfully");
      timeLeft.value = data.timeLeft || 0;
      updateGameState(data.gameState);
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
</script>

<style scoped>
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
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: "Courier New", monospace;
  min-width: 200px;
  border: 1px solid #333;
}

.hud-info p {
  margin: 5px 0;
  font-size: 14px;
}

.hud-buttons {
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
}

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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}</style>
