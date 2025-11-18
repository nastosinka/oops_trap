<template>
  <div class="lobby-container">
    <div class="nickname">{{ userName }} (ID: {{ userId }})</div>
    <div class="content">
      <div class="lobby-code">Code: {{ lobbyCode }}</div>
      <div class="players-scrollable-layer">
        <h2>Players ({{ players.length }})</h2>
        <div class="players-list">
          <div v-for="player in players" :key="player.id" class="player">
            <div
              class="player-color"
              :style="{ backgroundColor: player.color }"
            ></div>
            <span class="player-name">{{ player.name }}</span>
            <span v-if="player.id === userId" class="player-you">(You)</span>
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
          v-if="isHost"
          label="Start"
          size="large"
          @click="handleStart"
          :disabled="players.length < 2"
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
      userName
    };
  },

  data() {
    return {
      players: [],
      isHost: true,
      showSettings: false,
      currentSettings: {},
      lobbyId: null,
      pollInterval: null,
    };
  },

  computed: {
    lobbyCode() {
      return this.lobbyId ? this.lobbyId.toString() : "";
    }
  },

  created() {
    console.log("🟡 LobbyPage created - initializing...");
    this.userStore.initializeUser();
    this.isHost = this.$route.query.mode === "create";
    this.lobbyId = this.$route.query.id;
    
    console.log("🔵 Lobby data:", {
      isHost: this.isHost,
      lobbyId: this.lobbyId,
      userId: this.userId,
      routeQuery: this.$route.query
    });
    
    this.startPolling();
    this.fetchPlayers(); // Первоначальная загрузка
  },

  beforeUnmount() {
    console.log("🟡 LobbyPage unmounting - stopping polling");
    this.stopPolling();
  },

  methods: {
    startPolling() {
      console.log("🟢 Starting polling every 2 seconds");
      this.pollInterval = setInterval(() => {
        console.log("🔄 Polling players list...");
        this.fetchPlayers();
      }, 2000);
    },

    stopPolling() {
      if (this.pollInterval) {
        console.log("🔴 Stopping polling");
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },

    async fetchPlayers() {
      console.log("📡 Fetching players from API...");
      
      try {
        const url = `/api/lobby/lobbies/${this.lobbyId}/users`;
        console.log("🌐 API URL:", url);
        
        const response = await fetch(url);
        
        console.log("📊 Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ API response data:", data);
        
        // Проверяем структуру ответа
        if (!data.players) {
          console.warn("⚠️ No players array in response:", data);
          return;
        }
        
        console.log("👥 Players from API:", data.players);
        console.log("👥 Current players in state:", this.players);
        
        // Сравниваем массивы по содержимому
        const currentPlayersStr = JSON.stringify(this.players.map(p => ({ id: p.id, name: p.name })));
        const newPlayersStr = JSON.stringify(data.players.map(p => ({ id: p.id, name: p.name })));
        
        console.log("🔍 Comparing players:");
        console.log("Current:", currentPlayersStr);
        console.log("New:", newPlayersStr);
        
        if (currentPlayersStr !== newPlayersStr) {
          console.log("🔄 Players list changed - updating state");
          this.updatePlayersList(data.players);
        } else {
          console.log("⚡ Players list unchanged - skipping update");
        }

      } catch (error) {
        console.error("❌ Failed to fetch players:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
    },

    updatePlayersList(players) {
      console.log("🎨 Updating players list with colors");
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        color: this.getPlayerColor(index)
      }));
      
      console.log("🖌️ Final players list:", updatedPlayers);
      this.players = updatedPlayers;
    },

    getPlayerColor(index) {
      const colors = [
        "#FF6B6B", "#4ECDC4", "#FFD166", "#6A0572", "#118AB2",
        "#06D6A0", "#EF476F", "#FFD166", "#118AB2", "#06D6A0"
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

    async handleStart() {
      console.log("🎮 Start button clicked");
      console.log("📊 Current players count:", this.players.length);
      
      if (this.players.length < 2) {
        Modal.warning({
          title: "Not enough players",
          content: "Need at least 2 players to start the game",
          okText: "OK",
        });
        return;
      }

      const currentUserId = this.userStore.userId;
      
      if (!currentUserId) {
        Modal.error({
          title: "Error",
          content: "User not authenticated. Please log in again.",
          okText: "OK",
        });
        return;
      }

      try {
        console.log("🚀 Starting game...");
        const response = await fetch(`/api/lobby/lobbies/${this.lobbyId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: currentUserId,
            newStatus: "in-progress"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Start game response:", result);

          const gameId = result.gameId || this.lobbyId;
          console.log("🎯 Redirecting to game:", gameId);
          
          this.stopPolling();
          this.$router.push(`/game/${gameId}?lobbyId=${this.lobbyId}`);

        } else {
          const error = await response.json();
          console.error("❌ Start game failed:", error);
          Modal.error({
            title: "Error",
            content: error.message || "Failed to start game",
            okText: "OK",
          });
        }
      } catch (error) {
        console.error("❌ Start game error:", error);
        Modal.error({
          title: "Error",
          content: "Failed to start game: " + error.message,
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
      const currentUserId = this.userStore.userId;

      try {
        if (this.isHost) {
          console.log("🗑️ Host - deleting lobby");
          const response = await fetch(
            `/api/lobby/lobbies/${this.lobbyId}/delete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ownerId: currentUserId,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
        } else {
          console.log("👋 Player - leaving lobby");
          const response = await fetch(
            `/api/lobby/lobbies/${this.lobbyId}/leave`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: currentUserId,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
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
  },
};
</script>

<style scoped>
.player-you {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-style: italic;
}
</style>

<!-- <template>
  <div class="lobby-container">
    <div class="nickname">{{ userName }} (ID: {{ userId }})</div>
    <div class="content">
      <div class="lobby-code">Code: {{ lobbyCode }}</div>
      <div class="players-scrollable-layer">
        <h2>Players</h2>
        <div class="players-list">
          <div v-for="player in players" :key="player.id" class="player">
            <div
              class="player-color"
              :style="{ backgroundColor: player.color }"
            ></div>
            <span class="player-name">{{ player.name }}</span>
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
          v-if="isHost"
          label="Start"
          size="large"
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
      userName
    };
  },

  data() {
    return {
      players: [
        { id: 1, name: "Player 1", color: "#FF6B6B" },
        { id: 2, name: "Player 2", color: "#4ECDC4" },
        { id: 3, name: "Player 3", color: "#FFD166" },
        { id: 4, name: "Player 4", color: "#6A0572" },
        { id: 5, name: "Player 5", color: "#118AB2" },
        { id: 6, name: "Player 6", color: "#06D6A0" },
        { id: 7, name: "Player 7", color: "#EF476F" },
        { id: 8, name: "Player 8", color: "#FFD166" },
        { id: 9, name: "Player 9", color: "#118AB2" },
        { id: 10, name: "Player 10", color: "#06D6A0" },
      ],
      isHost: true,
      showSettings: false,
      currentSettings: {},
      lobbyId: null,
    };
  },

  computed: {
    lobbyCode() {
      return this.lobbyId ? this.lobbyId.toString() : "";
    }
  },

  created() {
    console.log("Before initializeUser:", {
      userId: this.userId,
      user: this.user,
      sessionStorage: {
        user: sessionStorage.getItem('user_session_id') ? sessionStorage.getItem(`user_${sessionStorage.getItem('user_session_id')}`) : 'no session'
      }
    });

    this.userStore.initializeUser();
    
    console.log("After initializeUser:", {
      userId: this.userId,
      user: this.user,
      sessionId: this.userStore.sessionId
    });

    this.isHost = this.$route.query.mode === "create";
    this.lobbyId = this.$route.query.id;

    console.log("Lobby created:", {
      isHost: this.isHost,
      lobbyId: this.lobbyId,
      routeQuery: this.$route.query
    });
  },

  methods: {
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

      const apiSettings = {
        ownerId: currentUserId,
        map: settings.map || 1,
        time: settings.time || "normal",
        trapper: settings.mafia || 1,
      };

      console.log("Applying settings with ownerId:", currentUserId);

      const response = await fetch(
        `/api/lobby/lobbies/${this.lobbyId}/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiSettings),
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
        Modal.error({
          title: "Error",
          content: "Failed to update settings",
          okText: "OK",
        });
      }
    },

    async handleStart() {
      if (this.players.length < 2) {
        Modal.warning({
          title: "Not enough players",
          content: "Need at least 2 players to start the game",
          okText: "OK",
        });
        return;
      }

      const currentUserId = this.userStore.userId;
      
      if (!currentUserId) {
        Modal.error({
          title: "Error",
          content: "User not authenticated. Please log in again.",
          okText: "OK",
        });
        return;
      }

      console.log("Starting game with:", {
        ownerId: currentUserId,
        newStatus: "in-progress",
        lobbyId: this.lobbyId
      });

      try {
        const response = await fetch(`/api/lobby/lobbies/${this.lobbyId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: currentUserId,
            newStatus: "in-progress"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Start game response:", result);
          
          if (result.gameId) {
            this.$router.push(`/game/${result.gameId}`);
          } else if (result.lobby && result.lobby.id) {
            this.$router.push(`/game/${result.lobby.id}`);
          } else {
            this.$router.push(`/game/${this.lobbyId}`);
          }
        } else {
          const error = await response.json();
          Modal.error({
            title: "Error",
            content: error.message || "Failed to start game",
            okText: "OK",
          });
        }
      } catch (error) {
        Modal.error({
          title: "Error",
          content: "Failed to start game: " + error.message,
          okText: "OK",
        });
      }
    },

    showExitConfirm() {
      Modal.confirm({
        title: "Exit Game",
        content: "Are you sure you want to exit the game?",
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
      const currentUserId = this.userStore.userId;

      if (this.isHost) {
        const response = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ownerId: currentUserId,
            }),
          }
        );

        if (!response.ok) {
          Modal.error({
            title: "Error",
            content: `Failed to delete lobby: ${response.status}`,
            okText: "OK",
          });
          return;
        }
      } else {
        const response = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/leave`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: currentUserId,
            }),
          }
        );

        if (!response.ok) {
          Modal.error({
            title: "Error",
            content: `Failed to leave lobby: ${response.status}`,
            okText: "OK",
          });
          return;
        }
      }

      this.$router.push("/createLobby");
    },
  },
};
</script> -->

<style scoped>
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
