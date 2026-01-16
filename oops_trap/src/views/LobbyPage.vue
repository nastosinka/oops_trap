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
            <span v-if="player.id === userId" class="player-you">(You)</span>
            <span v-if="player.isHost" class="player-host-badge">👑</span>
          </div>
        </div>
      </div>
      <div class="actions">
        <BaseButton
          v-if="isHost"
          label="Settings"
          size="large"
          :disabled="!hasPlayers"
          @click="openSettings"
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

    <UniversalModal
      v-if="showSettings"
      title="Game Settings"
      type="settings"
      :players="players"
      :initial-settings="currentSettings"
      @close="showSettings = false"
      @settings-apply="handleSettingsApply"
    />
  </div>
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
  components: { BaseButton, UniversalModal },

  setup() {
    const userStore = useUserStore();
    const { user, userId, userName, lobbySettings } = storeToRefs(userStore);
    return { userStore, user, userId, userName, lobbySettings };
  },

  data() {
    return {
      players: [],
      isHost: false,
      showSettings: false,
      currentSettings: {
        mafia: null,
        map: 1,
        time: "normal",
      },
      pendingSettings: {
        mafiaId: null,
        map: 1,
        time: "normal",
      },
      lobbyId: null,
      lobbyStatus: "waiting",
      pollInterval: null,
      lobbyOwnerId: null,
      currentGameId: null,
      lobbyOwnerId: null, // ID владельца лобби
      heartbeatInterval: null,
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
    hasPlayers() {
      return this.players && this.players.length > 0;
    },
  },

  async created() {
    console.log("[LobbyPage] created");
    this.userStore.initializeUser();
    this.lobbyId = this.$route.query.id;
    await this.checkIfUserIsHost();
    this.startPolling();
    this.startHeartbeat();
    this.fetchLobbyData();
  },

  beforeUnmount() {
    this.stopPolling();
    this.stopHeartbeat();
  },

  methods: {
    async checkIfUserIsHost() {
      console.log("[LobbyPage] checkIfUserIsHost");
      if (!this.lobbyId) {
        this.isHost = false;
        return;
      }
      try {
        const resp = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/settings`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await resp.json();
        this.isHost = data.success && data.data.ownerId === this.userId;
        this.lobbyOwnerId = data.data.ownerId;
        console.log(
          "[LobbyPage] isHost:",
          this.isHost,
          "ownerId:",
          this.lobbyOwnerId
        );
      } catch (e) {
        console.error("[LobbyPage] Error checkIfUserIsHost:", e);
        this.isHost = false;
      }
    },

    openSettings() {
      console.log("[LobbyPage] openSettings");
      if (!this.players.length) return;

      // Назначаем мафию безопасно
      const mafiaPlayer =
        this.players.find((p) => p.id === this.pendingSettings.mafiaId) ||
        this.players[0];

      this.currentSettings = {
        map: this.pendingSettings.map,
        mafia: mafiaPlayer,
        time: this.pendingSettings.time,
      };

      this.showSettings = true;
      console.log(
        "[LobbyPage] currentSettings for modal:",
        this.currentSettings
      );
    },

    startPolling() {
      this.pollInterval = setInterval(() => this.fetchLobbyData(), 2000);
    },

    stopPolling() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = null;
    },
    startHeartbeat() {
      this.heartbeatInterval = setInterval(() => {
        fetch(`/api/lobby/lobbies/${this.lobbyId}/ping`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {
          // намеренно ничего не делаем
        });
      }, 3000);
    },

    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    },

    async fetchLobbyData() {
      if (!this.lobbyId) return;
      console.log("[LobbyPage] fetchLobbyData");

      try {
        const statusResp = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/status`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (statusResp.ok) {
          const statusData = await statusResp.json();
          this.lobbyStatus = statusData.data.status;
          console.log("[LobbyPage] lobbyStatus:", this.lobbyStatus);
          if (this.lobbyStatus === "in-progress")
            await this.redirectToGamePage();
        }

        const playersResp = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/users`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (playersResp.ok) {
          const playersData = await playersResp.json();
          console.log("[LobbyPage] Players data:", playersData);
          this.updatePlayers(playersData.players || []);
        }

        const settingsResp = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/settings`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (settingsResp.ok) {
          const settingsData = await settingsResp.json();
          console.log("[LobbyPage] Settings data:", settingsData);

          if (settingsData.success && settingsData.data) {
            this.pendingSettings = {
              mafiaId: settingsData.data.trapper,
              map: settingsData.data.map || 1,
              time: settingsData.data.time || "normal",
            };
            this.userStore.lobbySettings = { ...this.pendingSettings };
            console.log(
              "[LobbyPage] pendingSettings updated:",
              this.pendingSettings
            );
          }
        }
      } catch (e) {
        console.error("[LobbyPage] fetchLobbyData error:", e);
      }
    },

    updatePlayers(players) {
      console.log("[LobbyPage] updatePlayers - updating list");

      const updated = players.map((p, idx) => ({
        ...p,
        color: this.getPlayerColor(idx),
        isHost: p.id === this.lobbyOwnerId,
      }));
      this.players = updated;

      const mafiaPlayer =
        this.players.find((p) => p.id === this.pendingSettings.mafiaId) ||
        this.players[0];
      this.pendingSettings.mafiaId = mafiaPlayer?.id;

      if (!this.showSettings) {
        this.currentSettings = {
          map: this.pendingSettings.map,
          mafia: mafiaPlayer,
          time: this.pendingSettings.time,
        };
      }

      this.userStore.gameMap = this.pendingSettings.map;
      this.userStore.myRole =
        mafiaPlayer?.id === this.userId ? "mafia" : "runner";

      console.log(
        "[LobbyPage] updatePlayers - currentSettings:",
        this.currentSettings
      );
      console.log(
        "[LobbyPage] updatePlayers - gameMap:",
        this.userStore.gameMap,
        "myRole:",
        this.userStore.myRole
      );
    },

    getPlayerColor(idx) {
      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#FFD166",
        "#6A0572",
        "#118AB2",
        "#06D6A0",
        "#EF476F",
      ];
      return colors[idx % colors.length];
    },

    async handleSettingsApply(settings) {
      console.log("[LobbyPage] handleSettingsApply called with:", settings);
      if (!this.isHost) {
        Modal.error({
          title: "Error",
          content: "Only host can change settings",
          okText: "OK",
        });
        return;
      }

      const apiSettings = {
        ownerId: this.userId,
        map: Number(settings.map),
        time: settings.time,
        trapper: settings.mafia.id,
      };

      try {
        const resp = await fetch(
          `/api/lobby/lobbies/${this.lobbyId}/settings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiSettings),
            credentials: "include",
          }
        );
        if (resp.ok) {
          // Сохраняем в локальные pending и current + store
          this.pendingSettings = {
            mafiaId: settings.mafia.id,
            map: Number(settings.map),
            time: settings.time,
          };
          this.currentSettings = {
            ...this.pendingSettings,
            mafia: settings.mafia,
          };
          this.userStore.lobbySettings = { ...this.pendingSettings };
          console.log(
            "[LobbyPage] Settings saved - pendingSettings:",
            this.pendingSettings
          );
          Modal.success({
            title: "Success",
            content: "Settings updated",
            okText: "OK",
          });
        } else throw new Error(`HTTP ${resp.status}`);
      } catch (e) {
        console.error("[LobbyPage] handleSettingsApply failed:", e);
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
        content: this.isHost ? "Exit and delete lobby?" : "Leave lobby?",
        okText: "Yes, Exit",
        cancelText: "Cancel",
        okType: "danger",
        centered: true,
        onOk: () => this.exitLobby(),
      });
    },

    async exitLobby() {
      try {
        await fetch(`/api/lobby/lobbies/${this.lobbyId}/leave`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.warn("leave failed, but continuing:", e);
      } finally {
        this.stopPolling();
        this.$router.replace("/createLobby");
      }
    },

    async handleStart() {
      if (this.players.length < 2) {
        Modal.warning({
          title: "Not enough players",
          content: "Need at least 2 players",
          okText: "OK",
        });
        return;
      }
      if (this.isHost) {
        this.userStore.gameMap = this.pendingSettings.map;
        this.userStore.myRole =
          this.players.find((p) => p.id === this.pendingSettings.mafiaId)
            ?.id === this.userId
            ? "mafia"
            : "runner";

        await this.createGameSocketConnection();
        await this.updateLobbyStatusToInProgress();
      }
      await this.redirectToGamePage();
    },

    async redirectToGamePage() {
      this.stopPolling();
      if (!this.isHost) await this.createGameSocketConnection();
      this.$router.push({
        path: `/game/${this.lobbyId}`,
        query: { lobbyId: this.lobbyId, isHost: this.isHost },
      });
    },

    async updateLobbyStatusToInProgress() {
      const resp = await fetch(`/api/lobby/lobbies/${this.lobbyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: "in-progress" }),
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to update status");
      await resp.json();
    },

    async createGameSocketConnection() {
      return new Promise((resolve, reject) => {
        try {
          const socket = createGameSocket(this.lobbyId);
          this.userStore.gameSocket = socket;
          socket.onopen = () => {
            socket.send(
              JSON.stringify({
                type: "init",
                playerId: this.userId,
                gameId: this.lobbyId,
                action: "player_ready",
                isHost: this.isHost,
              })
            );
            resolve(socket);
          };
          socket.onerror = () => reject(new Error("WebSocket failed"));
          setTimeout(() => {
            if (socket.readyState !== WebSocket.OPEN)
              reject(new Error("WebSocket timeout"));
          }, 5000);
        } catch (e) {
          reject(e);
        }
      });
    },
  },
};
</script>

<style scoped>
/* ===========================
   Игроки и бейджи
=========================== */
.player-host {
  font-weight: bold;
}

.player-host-badge {
  margin-left: 5px;
  font-size: 12px;
}

.nickname {
  font-weight: bold;
  position: absolute;
  top: 30px;
  right: 30px;
  font-size: 28px;
  color: #ffcc00;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 100;
  background: rgba(0, 0, 0, 0.15);
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.player-you {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-style: italic;
}
</style>

<style scoped>
/* ===========================
   Статусы лобби
=========================== */
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
/* ===========================
   Контейнер лобби
=========================== */
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

/* ===========================
   Список игроков
=========================== */
.players-scrollable-layer {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 0;
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

/* ===========================
   Скроллбар
=========================== */
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

/* ===========================
   Адаптив
=========================== */
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
