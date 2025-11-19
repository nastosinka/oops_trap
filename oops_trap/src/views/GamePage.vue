<template>
  <div class="game-container">
    <canvas ref="canvas" width="800" height="600"></canvas>

    <div class="hud">
      <div class="hud-info">
        <p>Time left: {{ timeLeft }}s</p>
        <p>Game ID: {{ gameId }}</p>
        <p>User ID: {{ userId }}</p>
        <p v-if="lobbyId">Lobby ID: {{ lobbyId }}</p>
        <p>Role: {{ isHost ? 'Host' : 'Player' }}</p>
        <p>Connection: <span :class="connectionStatusClass">{{ connectionStatus }}</span></p>
      </div>
      <div class="hud-buttons">
        <button @click="returnToLobby" class="lobby-btn" v-if="lobbyId">
          Return to Lobby
        </button>
      </div>
    </div>

    <div v-if="gameEnded" class="overlay">
      <div class="game-results">
        <h2>Game Over</h2>
        <div class="results-list">
          <div v-for="stat in stats" :key="stat.userId" class="result-item">
            <span class="player-name">{{ stat.userName || `Player ${stat.userId}` }}</span>
            <span class="player-score">{{ stat.score }} points</span>
            <span class="player-result" :class="{'winner': stat.result === 1}">
              {{ stat.result === 1 ? 'Winner' : 'Loser' }}
            </span>
          </div>
        </div>
        <div class="overlay-buttons">
          <button @click="returnToLobby" class="lobby-btn" v-if="lobbyId">Return to Lobby</button>
        </div>
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

// Game data
const gameId = computed(() => route.params.id || currentGameId.value || 1);
const userId = computed(() => storeUserId.value);
const lobbyId = computed(() => route.query.lobbyId);
const isHost = ref(false); // Будет установлено после проверки

// Game state
const timeLeft = ref(0);
const stats = ref([]);
const gameEnded = ref(false);
const canvas = ref(null);
const connectionError = ref(null);
const isConnected = ref(false);
const waitingForPlayers = ref(false);
const connectedPlayersCount = ref(0);
const totalPlayersCount = ref(0);

// Connection status
const connectionStatus = computed(() => {
  if (connectionError.value) return 'Disconnected';
  if (waitingForPlayers.value) return 'Waiting';
  return isConnected.value ? 'Connected' : 'Connecting...';
});

const connectionStatusClass = computed(() => {
  return {
    'status-connected': isConnected.value,
    'status-disconnected': connectionError.value,
    'status-waiting': waitingForPlayers.value
  };
});

onMounted(async () => {
  userStore.initializeUser();
  
  // Проверяем, является ли пользователь хостом
  await checkIfUserIsHost();
  
  connectGameWebSocket();
  initializeGame();
});

onUnmounted(() => {
  cleanupWebSocketHandlers();
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
    const response = await fetch(`/api/lobby/lobbies/${lobbyId.value}/settings`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      isHost.value = data.data.ownerId === userId.value;
      console.log(`🎮 User is ${isHost.value ? 'HOST' : 'PLAYER'} of lobby ${lobbyId.value}`);
    } else {
      isHost.value = false;
    }
  } catch (error) {
    console.error("❌ Error checking host status:", error);
    isHost.value = false;
  }
};

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
        isHost: isHost.value
      });
      
    } else {
      console.log("🔄 Creating new game WebSocket connection");
      
      await userStore.createGameSocketConnection(gameId.value, lobbyId.value);
      
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
      isHost: isHost.value
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
      connectionError.value = `Connection lost: ${event.reason || 'Unknown reason'}`;
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

const initializeGame = () => {
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Add game controls and logic here
    setupGameControls();
  }
};

const setupGameControls = () => {
  // Example: Keyboard controls
  const handleKeyDown = (event) => {
    if (!isConnected.value || gameEnded.value) return;

    switch(event.key) {
      case 'ArrowUp':
      case 'w':
        userStore.sendGameMessage({
          type: "PLAYER_MOVE",
          userId: userId.value,
          direction: 'up'
        });
        break;
      case 'ArrowDown':
      case 's':
        userStore.sendGameMessage({
          type: "PLAYER_MOVE",
          userId: userId.value,
          direction: 'down'
        });
        break;
      case 'ArrowLeft':
      case 'a':
        userStore.sendGameMessage({
          type: "PLAYER_MOVE",
          userId: userId.value,
          direction: 'left'
        });
        break;
      case 'ArrowRight':
      case 'd':
        userStore.sendGameMessage({
          type: "PLAYER_MOVE",
          userId: userId.value,
          direction: 'right'
        });
        break;
      case ' ':
        userStore.sendGameMessage({
          type: "GAME_ACTION",
          userId: userId.value,
          action: 'use'
        });
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
};

const updateGameState = (gameState) => {
  if (canvas.value && gameState) {
    const ctx = canvas.value.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Draw game objects
    if (gameState.players) {
      gameState.players.forEach(player => {
        ctx.fillStyle = player.color || '#ffffff';
        ctx.fillRect(player.x || 50, player.y || 50, 30, 30);
        
        // Draw player name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(player.name || `Player ${player.id}`, (player.x || 50) - 10, (player.y || 50) - 5);
      });
    }
  }
};

const reconnect = async () => {
  console.log("🔄 Attempting to reconnect...");
  connectionError.value = null;
  await connectGameWebSocket();
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
      await updateLobbyStatus('waiting');
      console.log("🎮 Host returned to lobby, status set to waiting");
    } else {
      console.log("🎮 Player returned to lobby");
    }
  } catch (error) {
    console.error("❌ Error updating lobby status:", error);
    // Продолжаем в любом случае
  }

  cleanupWebSocketHandlers();
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
        newStatus: newStatus
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

// Обработка событий страницы
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
  font-family: 'Courier New', monospace;
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
  background: #2196F3;
  color: white;
}

.lobby-btn:hover {
  background: #0b7dda;
}

.reconnect-btn {
  background: #4CAF50;
  color: white;
}

.reconnect-btn:hover {
  background: #45a049;
}

.status-connected {
  color: #4CAF50;
}

.status-disconnected {
  color: #ff4444;
}

.status-waiting {
  color: #FF9800;
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
  border-left-color: #4CAF50;
  background: #2d4a2d;
}

.player-name {
  font-weight: bold;
}

.player-score {
  color: #FFD166;
}

.player-result.winner {
  color: #4CAF50;
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
  border: 2px solid #FF9800;
  text-align: center;
}

.waiting-content h3 {
  color: #FF9800;
  margin-bottom: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #FF9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

canvas {
  display: block;
  background: #1a1a1a;
}
</style>