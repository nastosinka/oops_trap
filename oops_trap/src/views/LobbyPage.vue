<template>
  <div class="lobby-container">
    <div class="nickname">{{ userName }} (ID: {{ userId }})</div>
    <div class="content">
      <div class="lobby-code">Code: {{ lobbyCode }}</div>
      <div class="lobby-status" :class="statusClass">Status: {{ lobbyStatus }}</div>
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
          v-if="isHost && lobbyStatus === 'waiting'"
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
      lobbyStatus: "waiting", 
      pollInterval: null,
      currentGameId: null,
    };
  },

  computed: {
    lobbyCode() {
      return this.lobbyId ? this.lobbyId.toString() : "";
    },
    statusClass() {
      return {
        'status-waiting': this.lobbyStatus === 'waiting',
        'status-in-progress': this.lobbyStatus === 'in-progress',
        'status-finished': this.lobbyStatus === 'finished'
      };
    }
  },

  created() {
    this.userStore.initializeUser();
    this.isHost = this.$route.query.mode === "create";
    this.lobbyId = this.$route.query.id;
    
    this.startPolling();
    this.fetchLobbyData();
  },

  beforeUnmount() {
    this.stopPolling();
  },

  methods: {
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
        const statusUrl = `/api/lobby/lobbies/${this.lobbyId}/status`;
        
        const statusResponse = await fetch(statusUrl);
        
        if (!statusResponse.ok) {
          throw new Error(`HTTP ${statusResponse.status} - ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        
        if (statusData.success && statusData.data) {
          const newStatus = statusData.data.status;

          this.lobbyStatus = newStatus;
          
          this.checkLobbyStatus();
        }

        const playersUrl = `/api/lobby/lobbies/${this.lobbyId}/users`;
        
        const playersResponse = await fetch(playersUrl);
        
        if (!playersResponse.ok) {
          throw new Error(`HTTP ${playersResponse.status} - ${playersResponse.statusText}`);
        }

        const playersData = await playersResponse.json();
        
        const currentPlayersStr = JSON.stringify(this.players.map(p => ({ id: p.id, name: p.name })));
        const newPlayersStr = JSON.stringify(playersData.players.map(p => ({ id: p.id, name: p.name })));
        
        if (currentPlayersStr !== newPlayersStr) {
          this.updatePlayersList(playersData.players);
        }

      } catch (error) {
        throw new Error("Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
    },

    checkLobbyStatus() {
      if (this.lobbyStatus === 'in-progress') {
        this.redirectToGame();
      } else if (this.lobbyStatus === 'finished') {
        this.handleLobbyFinished();
      }
    },

    redirectToGame() {
      this.stopPolling();
      
      const gameId = this.lobbyId;
      this.$router.push(`/game/${gameId}`);
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
      console.log("🔄 Current lobby status:", this.lobbyStatus);
      
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
          
          Modal.success({
            title: "Success",
            content: "Game started successfully! Redirecting to game...",
            okText: "OK",
          });

        } else {
          const error = await response.json();
          console.error("❌ Start game failed:", error);
          Modal.error({
            title: "Error",
            content: error.message || error.details?.join(', ') || "Failed to start game",
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
