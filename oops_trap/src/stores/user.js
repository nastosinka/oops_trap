import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = ref(null);
  const token = ref(null);
  const sessionId = ref(null);
  const gameSocket = ref(null); // Добавляем хранение игрового сокета
  const currentGameId = ref(null); // Текущая игра
  const currentLobbyId = ref(null); // Текущее лобби

  const userId = computed(() => user.value?.id || null);
  const userName = computed(() => user.value?.name || "Guest");
  const isAuthenticated = computed(() => !!token.value);
  const isInGame = computed(
    () => !!gameSocket.value && gameSocket.value.readyState === WebSocket.OPEN
  );
  const getGameSocket = computed(() => gameSocket.value);

  const initializeUser = () => {
    if (!sessionId.value) {
      sessionId.value =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }

    const userData = sessionStorage.getItem(`user_${sessionId.value}`);
    const tokenData = sessionStorage.getItem(`token_${sessionId.value}`);

    if (userData) user.value = JSON.parse(userData);
    if (tokenData) token.value = tokenData;
  };

  const setUser = (userData) => {
    if (!sessionId.value) initializeUser();
    user.value = userData;
    sessionStorage.setItem(`user_${sessionId.value}`, JSON.stringify(userData));
  };

  const setToken = (tokenData) => {
    if (!sessionId.value) initializeUser();
    token.value = tokenData;
    sessionStorage.setItem(`token_${sessionId.value}`, tokenData);
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    // Закрываем игровой сокет при выходе
    closeGameSocket();

    user.value = null;
    token.value = null;
    currentGameId.value = null;
    currentLobbyId.value = null;

    sessionStorage.removeItem(`user_${sessionId.value}`);
    sessionStorage.removeItem(`token_${sessionId.value}`);
    sessionId.value = null;
  };

  // Методы для управления игровым сокетом
  const setGameSocket = (socket, gameId = null, lobbyId = null) => {
    // Закрываем предыдущее соединение если есть
    if (gameSocket.value && gameSocket.value.readyState === WebSocket.OPEN) {
      gameSocket.value.close(1000, "Reconnecting to new game");
    }

    gameSocket.value = socket;
    if (gameId) currentGameId.value = gameId;
    if (lobbyId) currentLobbyId.value = lobbyId;

    console.log("🎮 Game socket set for game:", gameId, "lobby:", lobbyId);
  };

  const closeGameSocket = (code = 1000, reason = "User left") => {
    if (gameSocket.value) {
      if (gameSocket.value.readyState === WebSocket.OPEN) {
        // Отправляем сообщение о выходе из игры перед закрытием
        try {
          gameSocket.value.send(
            JSON.stringify({
              type: "PLAYER_LEFT",
              gameId: currentGameId.value,
              userId: userId.value,
              lobbyId: currentLobbyId.value,
            })
          );
        } catch (error) {
          console.warn("Could not send leave message:", error);
        }

        gameSocket.value.close(code, reason);
      }
      gameSocket.value = null;
    }

    currentGameId.value = null;
    currentLobbyId.value = null;

    console.log("🔌 Game socket closed");
  };

  const createGameSocketConnection = (gameId, lobbyId = null) => {
    return new Promise((resolve, reject) => {
      try {
        // Закрываем существующее соединение
        closeGameSocket();

        // Создаем новое WebSocket соединение
        const socket = new WebSocket(`ws://${import.meta.env.VITE_SERVER_IP}/ws/game/${gameId}`);
        
        socket.onopen = () => {
          console.log(
            "✅ Game WebSocket connected successfully for game:",
            gameId
          );

          // Сохраняем сокет в store
          setGameSocket(socket, gameId, lobbyId);

          // Отправляем инициализационное сообщение
          socket.send(
            JSON.stringify({
              type: "init",
              playerId: userId.value,
              gameId,
              lobbyId,
              action: "player_ready",
            })
          );

          resolve(socket);
        };

        socket.onerror = (error) => {
          console.error("❌ Game WebSocket connection error:", error);
          reject(new Error("Failed to connect to game server"));
        };

        socket.onclose = (event) => {
          console.log("🔌 Game WebSocket closed:", event.code, event.reason);
          if (event.code !== 1000) {
            // Непредвиденное закрытие - очищаем состояние
            gameSocket.value = null;
            currentGameId.value = null;
          }
        };

        // Таймаут для соединения
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Восстановление соединения при перезагрузке страницы
  const reconnectGameSocket = async (gameId, lobbyId = null) => {
    if (!gameId) {
      console.warn("Cannot reconnect: no gameId provided");
      return null;
    }

    try {
      const socket = await createGameSocketConnection(gameId, lobbyId);

      // Отправляем сообщение о переподключении
      socket.send(
        JSON.stringify({
          type: "PLAYER_RECONNECTED",
          gameId,
          userId: userId.value,
          lobbyId,
        })
      );

      return socket;
    } catch (error) {
      console.error("Failed to reconnect game socket:", error);
      return null;
    }
  };

  // Отправка сообщения через игровой сокет
  const sendGameMessage = (message) => {
    if (!gameSocket.value || gameSocket.value.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: game socket not connected");
      return false;
    }

    try {
      const payload =
        typeof message === "string" ? message : JSON.stringify(message);
      gameSocket.value.send(payload);
      return true;
    } catch (error) {
      console.error("Error sending game message:", error);
      return false;
    }
  };

  // Очистка игрового состояния (при выходе из игры)
  const clearGameState = () => {
    closeGameSocket();
    currentGameId.value = null;
    currentLobbyId.value = null;
  };

  return {
    // Данные пользователя
    user,
    token,
    sessionId,
    gameSocket,
    currentGameId,
    currentLobbyId,

    // Computed свойства
    userId,
    userName,
    isAuthenticated,
    isInGame,
    getGameSocket,

    // Методы аутентификации
    initializeUser,
    setUser,
    setToken,
    login,
    logout,

    // Методы управления игровым сокетом
    setGameSocket,
    closeGameSocket,
    createGameSocketConnection,
    reconnectGameSocket,
    sendGameMessage,
    clearGameState,
  };
});
