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
            <div class="player-color" :style="{ backgroundColor: player.color }"></div>
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
import UniversalModal from "@/components/base/UniversalModal.vue";
import { Modal } from "ant-design-vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { createGameSocket } from "@/utils/websocket";

export default {
  name: "LobbyPage",
  components: { BaseButton, UniversalModal },

  setup() {
    const userStore = useUserStore();
    const { user, userId, userName } = storeToRefs(userStore);
    return { userStore, user, userId, userName };
  },

  data() {
    return {
      lobbyId: null,
      players: [],
      isHost: false,
      lobbyOwnerId: null,
      lobbyStatus: "waiting",
      pollInterval: null,

      // Настройки
      pendingSettings: { mafiaId: null, map: 1, time: "normal" }, // от сервера
      currentSettings: { mafia: null, map: 1, time: "normal" }, // локально для модалки

      showSettings: false,
    };
  },

  computed: {
    lobbyCode() {
      return this.lobbyId || "";
    },
    statusClass() {
      return {
        "status-waiting": this.lobbyStatus === "waiting",
        "status-in-progress": this.lobbyStatus === "in-progress",
        "status-finished": this.lobbyStatus === "finished",
      };
    },
    hasPlayers() {
      return this.players.length > 0;
    },
  },

  async created() {
    console.log("[LobbyPage] created - initializing user");
    this.userStore.initializeUser();
    this.lobbyId = this.$route.query.id;
    console.log("[LobbyPage] Lobby ID:", this.lobbyId);

    await this.fetchLobbySettings();
    this.startPolling();
    await this.fetchLobbyData();
  },

  beforeUnmount() {
    this.stopPolling();
  },

  methods: {
    startPolling() {
      console.log("[LobbyPage] startPolling");
      this.pollInterval = setInterval(() => this.fetchLobbyData(), 2000);
    },

    stopPolling() {
      console.log("[LobbyPage] stopPolling");
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = null;
    },

    async fetchLobbySettings() {
      if (!this.lobbyId) return;
      try {
        console.log("[LobbyPage] fetchLobbySettings - sending request");
        const res = await fetch(`/api/lobby/lobbies/${this.lobbyId}/settings`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("[LobbyPage] fetchLobbySettings - received", data);

        if (data.success && data.data) {
          this.lobbyOwnerId = data.data.ownerId;
          this.isHost = data.data.ownerId === this.userId;

          this.pendingSettings = {
            mafiaId: data.data.trapper,
            map: data.data.map || 1,
            time: data.data.time || "normal",
          };

          console.log("[LobbyPage] pendingSettings updated:", this.pendingSettings);
        }
      } catch (err) {
        console.error("[LobbyPage] Failed to fetch lobby settings:", err);
      }
    },

    async fetchLobbyData() {
      if (!this.lobbyId) return;

      try {
        console.log("[LobbyPage] fetchLobbyData - fetching status");
        // Статус лобби
        const statusRes = await fetch(`/api/lobby/lobbies/${this.lobbyId}/status`, {
          method: "GET",
          credentials: "include",
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          console.log("[LobbyPage] Lobby status data:", statusData);
          if (statusData.success) {
            this.lobbyStatus = statusData.data.status;
            if (this.lobbyStatus === "in-progress") {
              await this.redirectToGamePage();
            }
          }
        }

        console.log("[LobbyPage] fetchLobbyData - fetching players");
        // Список игроков
        const playersRes = await fetch(`/api/lobby/lobbies/${this.lobbyId}/users`, {
          method: "GET",
          credentials: "include",
        });
        if (playersRes.ok) {
          const playersData = await playersRes.json();
          console.log("[LobbyPage] Players data:", playersData);
          this.updatePlayers(playersData.players || []);
        }

        console.log("[LobbyPage] fetchLobbyData - re-fetch settings for sync");
        await this.fetchLobbySettings();

      } catch (err) {
        console.error("[LobbyPage] Failed to fetch lobby data:", err);
      }
    },

    updatePlayers(players) {
      console.log("[LobbyPage] updatePlayers - updating players list");
      this.players = players.map((p, i) => ({
        ...p,
        color: this.getPlayerColor(i),
        isHost: p.id === this.lobbyOwnerId,
      }));

      console.log("[LobbyPage] updatePlayers - players after update:", this.players);

      // Обновляем текущую мафию для модалки только если она закрыта
      if (!this.showSettings) {
        const mafia = this.players.find(p => p.id === this.pendingSettings.mafiaId) || this.players[0] || null;
        this.currentSettings = { ...this.pendingSettings, mafia };
        console.log("[LobbyPage] updatePlayers - currentSettings updated:", this.currentSettings);
      }
    },

    getPlayerColor(index) {
      const colors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#6A0572", "#118AB2", "#06D6A0", "#EF476F", "#FFD166", "#118AB2", "#06D6A0"];
      return colors[index % colors.length];
    },

    openSettings() {
      console.log("[LobbyPage] openSettings called");
      const mafia = this.players.find(p => p.id === this.pendingSettings.mafiaId) || this.players[0] || null;
      this.currentSettings = { ...this.pendingSettings, mafia };
      console.log("[LobbyPage] openSettings - currentSettings:", this.currentSettings);
      this.showSettings = true;
    },

    async handleSettingsApply(settings) {
      console.log("[LobbyPage] handleSettingsApply called with settings:", settings);
      if (!this.isHost) {
        return Modal.error({ title: "Error", content: "Only the host can change settings." });
      }

      const apiSettings = {
        ownerId: this.userId,
        map: Number(settings.map) || 1,
        time: settings.time || "normal",
        trapper: settings.mafia.id,
      };

      try {
        const res = await fetch(`/api/lobby/lobbies/${this.lobbyId}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiSettings),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        console.log("[LobbyPage] handleSettingsApply - settings saved on server");

        this.pendingSettings = { mafiaId: settings.mafia.id, map: Number(settings.map), time: settings.time };
        this.currentSettings = { ...this.pendingSettings, mafia: settings.mafia };

        console.log("[LobbyPage] handleSettingsApply - pendingSettings:", this.pendingSettings);
        console.log("[LobbyPage] handleSettingsApply - currentSettings:", this.currentSettings);

        // Обновляем store
        this.userStore.setLobbySettings({ ...this.pendingSettings });

        Modal.success({ title: "Success", content: "Settings updated" });

      } catch (err) {
        console.error("[LobbyPage] Failed to apply settings:", err);
        Modal.error({ title: "Error", content: "Failed to update settings" });
      }
    },

    showExitConfirm() {
      Modal.confirm({
        title: "Exit Lobby",
        content: this.isHost ? "Exit and delete the lobby?" : "Leave the lobby?",
        okText: "Yes",
        cancelText: "Cancel",
        okType: "danger",
        centered: true,
        onOk: this.exitLobby,
      });
    },

    async exitLobby() {
      try {
        const res = await fetch(`/api/lobby/lobbies/${this.lobbyId}/leave`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.stopPolling();
        this.$router.push("/createLobby");
      } catch (err) {
        console.error("[LobbyPage] Failed to exit lobby:", err);
        Modal.error({ title: "Error", content: `Failed to leave lobby: ${err.message}` });
      }
    },

    async handleStart() {
      if (this.players.length < 2) {
        return Modal.warning({ title: "Not enough players", content: "Need at least 2 players to start the game" });
      }
      if (this.isHost) {
        await this.createGameSocketConnection();
        await this.updateLobbyStatus("in-progress");
      }
      await this.redirectToGamePage();
    },

    async updateLobbyStatus(status) {
      await fetch(`/api/lobby/lobbies/${this.lobbyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: status }),
        credentials: "include",
      });
    },

    async redirectToGamePage() {
      console.log("[LobbyPage] redirectToGamePage called");
      this.stopPolling();
      if (!this.isHost) await this.createGameSocketConnection();
      this.$router.push({ path: `/game/${this.lobbyId}`, query: { lobbyId: this.lobbyId, isHost: this.isHost } });
    },

    async createGameSocketConnection() {
      return new Promise((resolve, reject) => {
        try {
          console.log("[LobbyPage] createGameSocketConnection called");
          const gameSocket = createGameSocket(this.lobbyId);
          this.userStore.setGameSocket(gameSocket, this.lobbyId, this.lobbyId);
          gameSocket.onopen = () => {
            console.log("[LobbyPage] WebSocket opened");
            gameSocket.send(JSON.stringify({ type: "init", playerId: this.userId, gameId: this.lobbyId, action: "player_ready", isHost: this.isHost }));
            resolve(gameSocket);
          };
          gameSocket.onerror = () => reject(new Error("Failed WebSocket"));
          setTimeout(() => {
            if (gameSocket.readyState !== WebSocket.OPEN) reject(new Error("WebSocket timeout"));
          }, 5000);
        } catch (err) {
          reject(err);
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
