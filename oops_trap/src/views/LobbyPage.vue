<template>
  <div class="lobby-container">
    <div class="nickname">{{ nickname }}</div>
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

export default {
  name: "LobbyPage",
  components: {
    BaseButton,
    UniversalModal,
  },
  data() {
    return {
      nickname: "Nickname",
      lobbyCode: "XYZ789",
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
      isHost: false,
      showSettings: false,
      currentSettings: {
        // текущие настройки
      },
    };
  },
  created() {
    this.isHost = this.$route.query.mode === "create";
  },
  methods: {
    handleSettings() {
      // настройки
    },
    handleStart() {
      // начать игру
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
          this.exitGame();
        },
      });
    },

    handleSettingsApply(settings) {
      this.currentSettings = settings;
    },

    exitGame() {
      Modal.success({
        title: "Game Exited",
        content: "Thank you for playing!",
        okText: "OK",
        onOk: () => {
          this.$router.push("/createLobby");
        },
      });
    },
  },
};
</script>

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
  margin-top: 60px;
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
