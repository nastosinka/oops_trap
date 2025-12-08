<template>
  <div class="lobby-container">
    <div class="nickname">
      {{ userName }} (ID: {{ userId }}) {{ isHost ? "👑" : "" }}
    </div>
    <div class="content">
      <div class="lobby-code">Code: {{ lobbyCode }}</div>
      <div class="lobby-status" :class="statusClass">
        Status: {{ lobbyStatus }}
      </div>
      <div class="players-scrollable-layer">
        <h2>Players ({{ players.length }})</h2>
        <div class="players-list">
          <div
            v-for="player in players"
            :key="player.id"
            class="player"
            :class="{ 'player-host': player.isHost }"
          >
            <div
              class="player-color"
              :style="{ backgroundColor: player.color }"
            ></div>
            <span class="player-name">{{ player.name }}</span>
            <span v-if="player.id === userId" class="player-you">(You) </span>
            <span v-if="player.isHost" class="player-host-badge">👑</span>
          </div>
        </div>
      </div>
      <div class="actions">
        <BaseButton
          v-if="isHost"
          label="Settings"
          size="large"
          @click="showSettings = true"
        />
        <BaseButton
          v-if="isHost && lobbyStatus === 'waiting'"
          label="Start"
          size="large"
          :disabled="players.length < 2"
          @click="handleStart"
        />
        <BaseButton label="Exit" size="large" @click="showExitConfirm" />
      </div>
    </div>
  </div>
  <UniversalModal
    v-if="showSettings"
    title="Game Settings"
    type="settings"
    :players="players"
    :initial-settings="currentSettings"
    @close="showSettings = false"
    @settings-apply="handleSettingsApply"
  />
</template>

<script>
import BaseButton from "@/components/base/BaseButton.vue";
import { Modal } from "ant-design-vue";
import UniversalModal from "@/components/base/UniversalModal.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { createGameSocket } from "@/utils/websocket";

export default {
  name: "LobbyPage",
  components: {
    BaseButton,
    UniversalModal,
  },

  setup() {
    const userStore = useUserStore();
    const { user, userId, userName } = storeToRefs(userStore);

    return {
      userStore,
      user,
      userId,
      userName,
    };
  },

  data() {
    return {
      players: [],
      isHost: false, // Будет установлено после проверки
      showSettings: false,
      currentSettings: {},
      lobbyId: null,
      lobbyStatus: "waiting",
      pollInterval: null,
      currentGameId: null,
      lobbyOwnerId: null, // ID владельца лобби
    };
  },

  computed: {
    lobbyCode() {
      return this.lobbyId ? this.lobbyId.toString() : "";
    },
    statusClass() {
      return {
        "status-waiting": this.lobbyStatus === "waiting",
        "status-in-progress": this.lobbyStatus === "in-progress",
        "status-finished": this.lobbyStatus === "finished",
      };
    },
  },

  async created() {
    console.log("🟡 LobbyPage created - initializing...");
    this.userStore.initializeUser();
    this.lobbyId = this.$route.query.id;

    console.log("🔵 Lobby data:", {
      lobbyId: this.lobbyId,
      userId: this.userId,
      routeQuery: this.$route.query,
    });

    // Сначала проверяем, является ли пользователь хостом
    await this.checkIfUserIsHost();

    this.startPolling();
    this.fetchLobbyData();
  },

  beforeUnmount() {
    this.stopPolling();
  },

  methods: {
    // Проверяем, является ли пользователь хостом лобби
    async checkIfUserIsHost() {
      if (!this.lobbyId) {
        this.isHost = false;
        return;
      }

      try {
        const response = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/settings`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          this.lobbyOwnerId = data.data.ownerId;
          this.isHost = data.data.ownerId === this.userId;
          console.log(
            `🎮 User is ${this.isHost ? "HOST" : "PLAYER"} of lobby ${
              this.lobbyId
            }`
          );
          console.log(
            `👑 Lobby owner ID: ${this.lobbyOwnerId}, User ID: ${this.userId}`
          );
        } else {
          this.isHost = false;
        }
      } catch (error) {
        console.error("❌ Error checking host status:", error);
        this.isHost = false;
      }
    },

    startPolling() {
      this.pollInterval = setInterval(() => {
        this.fetchLobbyData();
      }, 2000);
    },

    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },

    async fetchLobbyData() {
      try {
        // Получаем статус лобби
        const statusUrl = `/api/lobby/lobbies/${this.lobbyId}/status`;
        const statusResponse = await fetch(statusUrl, {
          method: "GET",
          credentials: "include",
        });

        if (!statusResponse.ok) {
          throw new Error(
            `HTTP ${statusResponse.status} - ${statusResponse.statusText}`
          );
        }

        const statusData = await statusResponse.json();

        if (statusData.success && statusData.data) {
          const newStatus = statusData.data.status;
          this.lobbyStatus = newStatus;
          this.checkLobbyStatus();
        }

        // Получаем настройки лобби для актуальной информации о владельце
        const settingsUrl = `/api/lobby/lobbies/${this.lobbyId}/settings`;
        const settingsResponse = await fetch(settingsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data) {
            this.lobbyOwnerId = settingsData.data.ownerId;
            this.isHost = settingsData.data.ownerId === this.userId;

            // Обновляем текущие настройки
            this.currentSettings = {
              map: settingsData.data.map || "city",
              mafia: settingsData.data.trapper || 1,
              time: settingsData.data.time || "normal",
            };
          }
        }

        // Получаем список игроков
        const playersUrl = `/api/lobby/lobbies/${this.lobbyId}/users`;
        const playersResponse = await fetch(playersUrl, {
          method: "GET",
          credentials: "include",
        });

        if (!playersResponse.ok) {
          throw new Error(
            `HTTP ${playersResponse.status} - ${statusResponse.statusText}`
          );
        }

        const playersData = await playersResponse.json();

        // Обновляем список игроков, если он изменился
        const currentPlayersStr = JSON.stringify(
          this.players.map((p) => ({ id: p.id, name: p.name }))
        );
        const newPlayersStr = JSON.stringify(
          playersData.players.map((p) => ({ id: p.id, name: p.name }))
        );

        if (currentPlayersStr !== newPlayersStr) {
          this.updatePlayersList(playersData.players);
        }
      } catch (error) {
        console.error("❌ Error fetching lobby data:", error);
        // Не выбрасываем ошибку, чтобы поллинг продолжался
      }
    },

    async checkLobbyStatus() {
      if (this.lobbyStatus === "in-progress") {
        await this.redirectToGamePage();
      }
    },

    updatePlayersList(players) {
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        color: this.getPlayerColor(index),
        isHost: player.id === this.lobbyOwnerId, // Помечаем хоста
      }));

      this.players = updatedPlayers;
      console.log("👥 Updated players list:", this.players);
    },

    getPlayerColor(index) {
      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#FFD166",
        "#6A0572",
        "#118AB2",
        "#06D6A0",
        "#EF476F",
        "#FFD166",
        "#118AB2",
        "#06D6A0",
      ];
      return colors[index % colors.length];
    },

    async handleSettingsApply(settings) {
      const currentUserId = this.userStore.userId;

      if (!currentUserId) {
        Modal.error({
          title: "Error",
          content: "User ID not available. Please refresh the page.",
          okText: "OK",
        });
        return;
      }

      if (!this.isHost) {
        Modal.error({
          title: "Error",
          content: "Only the host can change settings.",
          okText: "OK",
        });
        return;
      }

      const apiSettings = {
        ownerId: currentUserId,
        map: settings.map || 1,
        time: settings.time || "normal",
        trapper: settings.mafia || 1,
      };

      try {
        const response = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/settings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiSettings),
            credentials: "include",
          }
        );

        if (response.ok) {
          this.currentSettings = {
            map: settings.map || "city",
            mafia: settings.mafia || 1,
            time: settings.time || "normal",
          };

          Modal.success({
            title: "Success",
            content: "Settings updated",
            okText: "OK",
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        Modal.error({
          title: "Error",
          content: "Failed to update settings",
          okText: "OK",
        });
      }
    },

    showExitConfirm() {
      Modal.confirm({
        title: "Exit Lobby",
        content: this.isHost
          ? "Are you sure you want to exit and delete the lobby?"
          : "Are you sure you want to leave the lobby?",
        okText: "Yes, Exit",
        cancelText: "Cancel",
        okType: "danger",
        centered: true,
        onOk: () => {
          this.exitLobby();
        },
      });
    },

    async exitLobby() {
      console.log("🚪 Exiting lobby...");

      try {
        console.log("👋 Player - leaving lobby");
        const response = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/leave`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        this.stopPolling();
        this.$router.push("/createLobby");
      } catch (error) {
        console.error("❌ Exit lobby error:", error);
        Modal.error({
          title: "Error",
          content: this.isHost
            ? `Failed to delete lobby: ${error.message}`
            : `Failed to leave lobby: ${error.message}`,
          okText: "OK",
        });
      }
    },

    // БЛОК ВЕБ СОКЕТОВ

    async handleStart() {
      // если хост - создаёт подключение и меняет статус, первый уходит в игру
      console.log(
        "Starting game flow... Current players count:",
        this.players.length
      );

      if (this.isHost) {
        if (this.players.length < 2) {
          Modal.warning({
            title: "Not enough players",
            content: "Need at least 2 players to start the game",
            okText: "OK",
          });
          return;
        }

        if (!this.userStore.userId) {
          Modal.error({
            title: "Error",
            content: "User not authenticated. Please log in again.",
            okText: "OK",
          });
          return;
        }
      }

      try {
        // создание сокета
        if (this.isHost) {
          await this.createGameSocketConnection();
        }
        // смена статуса
        if (this.isHost) {
          await this.updateLobbyStatusToInProgress();
        }
        // уходит в игру
        await this.redirectToGamePage();
      } catch (error) {
        console.error("❌ Game flow error:", error);
        Modal.error({
          title: "Error",
          content: "Failed to start game: " + error.message,
          okText: "OK",
        });
      }
    },

    async redirectToGamePage() {
      // эта штука запускается для всех, когда статус "в процессе"
      this.stopPolling();

      console.log("🔄 Redirecting to game:", this.lobbyId);

      try {
        // если не хост - создаем WebSocket соединение перед переходом (у хоста уже есть сокет)
        if (!this.isHost) {
          console.log(
            "👤 Player - creating WebSocket connection before redirect"
          );
          await this.createGameSocketConnection();
        }

        // переходим в игру
        this.$router.push({
          path: `/game/${this.lobbyId}`,
          query: {
            lobbyId: this.lobbyId,
            isHost: this.isHost,
          },
        });
      } catch (error) {
        console.error("❌ Failed to redirect to game:", error);
        Modal.error({
          title: "Connection Error",
          content: "Failed to connect to game server",
          okText: "OK",
        });
      }
    },

    async updateLobbyStatusToInProgress() {
      // обновление статуса лобби
      const response = await fetch(
        `/api/lobby/lobbies/${this.lobbyId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newStatus: "in-progress",
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update lobby status");
      }

      const result = await response.json();
      console.log("✅ Lobby status updated:", result);

      Modal.success({
        title: "Success",
        content: "Game started successfully! Redirecting to game...",
        okText: "OK",
      });
    },

    async createGameSocketConnection() {
      // создаём веб сокет и сохраняем в хранилище
      console.log(`Пытаемся создать подключение с ${this.lobbyId}`);
      return new Promise((resolve, reject) => {
        try {
          // Создаем локальный WebSocket
          const gameSocket = createGameSocket(this.lobbyId);

          // Сохраняем сокет в store
          this.userStore.setGameSocket(gameSocket, this.lobbyId, this.lobbyId);

          console.log(`мы УдавЛось, дальше обработка`);

          gameSocket.onopen = () => {
            console.log("✅ Game WebSocket connected successfully");

            // Отправляем инициализационное сообщение
            gameSocket.send(
              JSON.stringify({
                type: "init",
                playerId: this.userId,
                gameId: this.lobbyId,
                action: "player_ready",
                isHost: this.isHost,
              })
            );

            resolve(gameSocket);
          };

          gameSocket.onerror = (error) => {
            console.error("❌ Game WebSocket connection error:", error);
            reject(new Error("Failed to connect to game server"));
          };

          gameSocket.onclose = (event) => {
            console.log("🔌 Game WebSocket closed:", event.code, event.reason);
          };

          // Таймаут для соединения
          setTimeout(() => {
            if (gameSocket.readyState !== WebSocket.OPEN) {
              reject(new Error("WebSocket connection timeout"));
            }
          }, 5000);
        } catch (error) {
          reject(error);
        }
      });
    },
  },
};
</script>

<style scoped>
.player-host {
  font-weight: bold;
}

.player-host-badge {
  margin-left: 5px;
  font-size: 12px;
}

.nickname {
  font-weight: bold;
}
</style>

<style scoped>
.lobby-status {
  font-weight: bold;
  margin: 10px 0;
  padding: 5px 10px;
  border-radius: 4px;
  display: inline-block;
}

.status-waiting {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-in-progress {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-finished {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
</style>

<style scoped>
.player-you {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-style: italic;
}

.lobby-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url("@/assets/images/background.jpg") center/cover no-repeat;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Irish Grover", system-ui;
  color: #e5e5e5;
}

.nickname {
  position: absolute;
  top: 30px;
  right: 30px;
  font-size: 28px;
  color: #ffcc00;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 100;
  background: rgb(0, 0, 0, 0.15);
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.content {
  position: absolute;
  height: 65vh;
  background: rgba(40, 75, 99, 0.9);
  border-radius: 20px;
  padding: 40px 30px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.lobby-code {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.15);
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  border: 1px dashed rgba(255, 255, 255, 0.3);
}

.players-scrollable-layer {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 0px;
  overflow: hidden;
}

.players-scrollable-layer h2 {
  font-size: 32px;
  text-align: center;
  margin-bottom: 25px;
}

.players-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 5px;
}

.player {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: rgba(69, 114, 112, 0.7);
  border-radius: 12px;
  font-size: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.player-color {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
}

.players-list::-webkit-scrollbar {
  width: 8px;
}

.players-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.players-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.players-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 480px) {
  .content {
    width: 90vw;
    max-width: 300px;
  }
}

@media (min-width: 480px) {
  .content {
    width: 90vw;
    max-width: 400px;
  }
}

@media (min-width: 768px) {
  .content {
    width: 90vw;
    max-width: 700px;
  }
}

@media (min-width: 1024px) {
  .content {
    width: 90vw;
    max-width: 850px;
  }
}
</style>
