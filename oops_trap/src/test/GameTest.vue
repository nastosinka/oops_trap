<template>
    <!-- загрузочный экран -->
    <!-- <div v-if="showSplash" class="splash-screen"> -->
    <div v-if="false" class="splash-screen">
      <img src="/src/assets/images/1_R.png" alt="Splash" class="splash-image" />
    </div>
    <!-- часть игры -->
    <div v-else class="game-container">
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
            <button
              v-if="lobbyId"
              class="lobby-btn"
              :disabled="isGameActive"
              :title="
                isGameActive
                  ? 'Cannot return to lobby during active game'
                  : 'Return to lobby'
              "
              @click="returnToLobby"
            >
              {{ isGameActive ? "Game in Progress..." : "Return to Lobby" }}
            </button>
          </div>
        </div>
        <div class="container">
            <MapOfGame ref="mapRef" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useUserStore } from "@/stores/user";
  import { storeToRefs } from "pinia";
  import { Modal } from "ant-design-vue";
  import { reactive } from "vue";
  import MapOfGame from "@/views/MapOfGame.vue";
  
  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const {
    userId: storeUserId,
    getGameSocket,
    currentGameId,
  } = storeToRefs(userStore);
  
  // реактивные данные
  const gameId = computed(() => route.params.id || currentGameId.value || 1);
  const userId = computed(() => storeUserId.value);
  const lobbyId = computed(() => route.query.lobbyId);
  const isHost = ref(false);
  const showSplash = ref(true);
  const playerCoords = reactive({ x: 0, y: 0 });
  // игровые данные
  const timeLeft = ref(0);
  const isConnected = ref(false);
  const gameEnded = ref(false);
  const connectionError = ref(null);
  const timerActive = ref(false);
  const messageInput = ref("");
  const chatMessages = ref([]);
  
  // Computed property для проверки активности игры
  const isGameActive = computed(() => {
    return timerActive.value && timeLeft.value > 0 && !gameEnded.value;
  });
  
  // Connection status
  const connectionStatus = computed(() => {
    if (connectionError.value) return "Disconnected";
    return isConnected.value ? "Connected" : "Connecting...";
  });
  
  const connectionStatusClass = computed(() => {
    return {
      "status-connected": isConnected.value,
      "status-disconnected": connectionError.value,
    };
  });
  
  onMounted(async () => {
    setTimeout(() => {
      showSplash.value = false;
    }, 10000);
  
    userStore.initializeUser();
    await checkIfUserIsHost();
    setupGameWebSocket();
  
    playerCoords.x = 100;
    playerCoords.y = 100;
  
    // Отправляем серверу начальные координаты
    if (
      getGameSocket.value &&
      getGameSocket.value.readyState === WebSocket.OPEN
    ) {
      getGameSocket.value.send(
        JSON.stringify({
          type: "player_move",
          gameId: gameId.value,
          playerId: userId.value,
          settings: { x: 100, y: 100, lastImage: 1 },
        })
      );
    }
  });
  
  onUnmounted(() => {
    cleanupWebSocket();
  });
  
  // Проверяем, является ли пользователь хостом лобби
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
        console.log(
          `🎮 User is ${isHost.value ? "HOST" : "PLAYER"} of lobby ${
            lobbyId.value
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error checking host status:", error);
      isHost.value = false;
    }
  };
  
  const returnToLobby = async () => {
    // Проверяем, активна ли игра
    if (isGameActive.value) {
      Modal.warning({
        title: "Game in Progress",
        content:
          "Cannot return to lobby while the game is active. Please wait for the game to finish.",
        okText: "OK",
      });
      return;
    }
  
    if (!lobbyId.value) {
      Modal.error({
        title: "Cannot Return to Lobby",
        content: "Lobby information is not available",
      });
      return;
    }
  
    try {
      if (isHost.value) {
        await updateLobbyStatus("waiting");
        console.log("🎮 Host returned to lobby, status set to waiting");
      }
    } catch (error) {
      console.error("❌ Error updating lobby status:", error);
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
          newStatus,
        }),
        credentials: "include",
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
  
  // Веб-сокеты - используем сохраненный сокет из хранилища
  const setupGameWebSocket = () => {
    const socket = getGameSocket.value;
  
    if (!socket) {
      console.error("❌ No game socket found in store");
      connectionError.value = "No game connection";
      return;
    }
  
    isConnected.value = socket.readyState === WebSocket.OPEN;
  
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };
  
    socket.onclose = (event) => {
      console.log("🔌 Game WebSocket disconnected");
      isConnected.value = false;
  
      if (!event.wasClean) {
        connectionError.value = `Connection lost: ${
          event.reason || "Unknown error"
        }`;
      }
    };
  
    socket.onerror = (error) => {
      console.error("💥 Game WebSocket error:", error);
      connectionError.value = "Connection error";
    };
  
    // Если сокет уже открыт, отправляем init сообщение
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
  
  const cleanupWebSocket = () => {
    // Не закрываем сокет, так как он управляется хранилищем
    // Просто сбрасываем локальное состояние
    isConnected.value = false;
  };
  
  const handleGameMessage = (message) => {
    console.log("📨 Received game message:", message);
  
    switch (message.type) {
      case "timer_started":
        timerActive.value = true;
        timeLeft.value = message.timeLeft;
        addSystemMessage(`Game started! Time: ${message.totalTime} seconds`);
        break;
  
      case "timer_update":
        timerActive.value = message.active;
        timeLeft.value = message.timeLeft;
        if (message.timeLeft <= 0 && isHost.value) {
          updateLobbyStatus("finished");
          gameEnded.value = true;
        }
        break;
  
      case "chat_message":
        addChatMessage({
          id: Date.now() + Math.random(),
          playerId: message.playerId,
          text: message.text,
          timestamp: message.timestamp,
          isHost: message.isHost,
        });
        break;
      case "coord_message": {
        const me = message.coords.find((p) => p.id === userId.value);
        if (me) {
          playerCoords.x = me.x;
          playerCoords.y = me.y;
        }
        addSystemMessage(message.coords);
        break;
      }
      case "player_move": {
        const me = message.coords.find((p) => p.id === userId.value);
        if (me) {
          playerCoords.x = me.x;
          playerCoords.y = me.y;
        }
        addChatMessage({
          id: Date.now() + Math.random(),
          playerId: "Coord",
          text: JSON.stringify(message.coords),
          timestamp: message.timestamp,
          isHost: false,
        });
        break;
      }
      case "rollback":
        if (message.playerId === userId.value) {
          playerCoords.x = message.x;
          playerCoords.y = message.y;
        }
        break;
      // case "player_move":
      //   if (message.position && message.playerId === userId.value) {
      //     playerCoords.x = message.position.x;
      //     playerCoords.y = message.position.y;
      //   }
      //   break;
      case "player_joined":
        addSystemMessage(message.message);
        break;
  
      case "player_disconnected":
        addSystemMessage(message.message);
        break;
  
      default:
        console.log("Unknown message type:", message.type);
    }
  };
  
  const movePlayer = (dx, dy) => {
    const newX = playerCoords.x + dx;
    const newY = playerCoords.y + dy;
    const newImage = 1;
  
    if (!getGameSocket.value || getGameSocket.value.readyState !== WebSocket.OPEN)
      return;
  
    getGameSocket.value.send(
      JSON.stringify({
        type: "player_move",
        gameId: gameId.value,
        playerId: userId.value,
        settings: { x: newX, y: newY, lastImage: newImage },
      })
    );
  };
  
  const setRandomCoords = () => {
    const newX = 100;
    const newY = 100;
    const newImage = 1;
  
    if (!getGameSocket.value || getGameSocket.value.readyState !== WebSocket.OPEN)
      return;
  
    getGameSocket.value.send(
      JSON.stringify({
        type: "player_move",
        gameId: gameId.value,
        playerId: userId.value,
        settings: { x: newX, y: newY, lastImage: newImage },
      })
    );
  };
  
  const beginGetCoords = () => {
    getGameSocket.value.send(
      JSON.stringify({
        type: "coord_message",
        gameId: gameId.value,
      })
    );
  };
  
  const addChatMessage = (message) => {
    chatMessages.value.push(message);
    scrollChatToBottom();
  };
  
  const addSystemMessage = (text) => {
    chatMessages.value.push({
      id: Date.now() + Math.random(),
      playerId: "System",
      text,
      timestamp: new Date().toISOString(),
      isHost: false,
      isSystem: true,
    });
    scrollChatToBottom();
  };
  
  const scrollChatToBottom = () => {
    nextTick(() => {
      const chatContainer = document.getElementById("chat");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };
  
  const sendMessage = () => {
    const text = messageInput.value.trim();
  
    if (
      text &&
      getGameSocket.value &&
      getGameSocket.value.readyState === WebSocket.OPEN
    ) {
      getGameSocket.value.send(
        JSON.stringify({
          type: "chat_message",
          gameId: gameId.value,
          playerId: userId.value,
          text,
        })
      );
      messageInput.value = "";
    }
  };
  
  // Следим за изменениями сокета в хранилище
  watch(getGameSocket, (newSocket, oldSocket) => {
    if (newSocket !== oldSocket) {
      setupGameWebSocket();
    }
  });
  </script>
  
  <style scoped>
  .splash-screen img {
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
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
  
  /* Стили для disabled кнопки */
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
  </style>
  
  <style scoped>
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
    z-index: 50;
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
  