import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = ref(null);
  const sessionId = ref(null);
  const gameSocket = ref(null); // Добавляем хранение игрового сокета
  const currentGameId = ref(null); // Текущая игра
  const currentLobbyId = ref(null); // Текущее лобби
  const myRole = ref("runner");
  const gameMap = ref(1);

  const userId = computed(() => user.value?.id || null);
  const userName = computed(() => user.value?.name || "Guest");
  const isAuthenticated = computed(() => !!user.value);
  const isInGame = computed(
    () => !!gameSocket.value && gameSocket.value.readyState === WebSocket.OPEN
  );
  const getGameSocket = computed(() => gameSocket.value);

  const initializeUser = () => {
    if (!sessionId.value) {
      sessionId.value =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }
    const stored = sessionStorage.getItem(`user_${sessionId.value}`);
    if (stored) user.value = JSON.parse(stored);
  };

  const login = (userData) => {
    if (!sessionId.value) initializeUser();
    user.value = userData;
    sessionStorage.setItem(`user_${sessionId.value}`, JSON.stringify(userData));
  };

  const logout = () => {
    user.value = null;
    currentGameId.value = null;
    currentLobbyId.value = null;

    sessionStorage.removeItem(`user_${sessionId.value}`);
    sessionId.value = null;
  };

  // Методы для управления игровым сокетом
  const setGameSocket = (socket, gameId = null, lobbyId = null) => {
    if (gameSocket.value && gameSocket.value.readyState === WebSocket.OPEN) {
      gameSocket.value.close(1000, "Reconnecting to new game");
    }

    gameSocket.value = socket;
    if (gameId) currentGameId.value = gameId;
    if (lobbyId) currentLobbyId.value = lobbyId;

    console.log(
      "🎮 Game socket set for game:",
      currentGameId.value,
      "lobby:",
      currentLobbyId.value
    );
  };

  const clearGameState = () => {
    currentGameId.value = null;
    currentLobbyId.value = null;
  };

  const setMyRole = (role) => {
    myRole.value = role;
  };

  return {
    // Данные пользователя
    user,
    sessionId,
    gameSocket,
    currentGameId,
    currentLobbyId,
    myRole,
    gameMap,

    // Computed свойства
    userId,
    userName,
    isAuthenticated,
    isInGame,
    getGameSocket,

    // Методы аутентификации
    initializeUser,
    login,
    logout,
    setMyRole,

    // Методы управления игровым сокетом
    setGameSocket,
    clearGameState,
  };
});
