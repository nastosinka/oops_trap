<template>
  <div class="create-lobby-page">
    <div class="header-panel">
      <div class="trophy-icon" @click="showStatsModal = true">
        <i class="mdi mdi-trophy"></i>
      </div>
      <div class="nickname-section">
        <div class="nickname-label">Nickname</div>
      </div>
    </div>

    <div class="create-lobby-container">
      <div class="buttons-container">
        <BaseButton label="Rules" size="large" @click="showRulesModal = true" />
        <BaseButton size="large" label="Create a lobby" @click="createLobby" />
        <BaseButton
          size="large"
          label="Join the lobby"
          @click="showJoinLobby = true"
        />
        <BaseButton size="large" label="Exit" @click="showExitConfirm" />
      </div>
    </div>
  </div>

  <UniversalModal
    v-if="showStatsModal"
    title=""
    type="stats"
    :stats-data="statsData"
    size="xlarge"
    @close="showStatsModal = false"
  />

  <UniversalModal
    v-if="showJoinLobby"
    title=""
    :fields="['lobbyCode']"
    submit-text="Join"
    @close="showJoinLobby = false"
    @submit="joinLobby"
  />

  <UniversalModal
    v-if="showRulesModal"
    title=""
    type="rules"
    @close="showRulesModal = false"
  />
</template>

<script>
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";
import { Modal } from "ant-design-vue";

export default {
  name: "LobbyPage",

  components: {
    BaseButton,
    UniversalModal,
  },

  data() {
    return {
      showRulesModal: false,
      showJoinLobby: false,
      showStatsModal: false,
      statsData: [
        { map: "Vector", role: "trapmaker", time: "1:08" },
        { map: "Lucky", role: "runner", time: "2:09" },
        { map: "Vector", role: "runner", time: "1:15" },
        { map: "Lucky", role: "trapmaker", time: "2:25" },
        { map: "Vector", role: "trapmaker", time: "1:08" },
        { map: "Lucky", role: "runner", time: "2:09" },
        { map: "Vector", role: "runner", time: "1:15" },
        { map: "Lucky", role: "trapmaker", time: "2:25" },
        { map: "Vector", role: "trapmaker", time: "1:08" },
        { map: "Lucky", role: "runner", time: "2:09" },
        { map: "Vector", role: "runner", time: "1:15" },
        { map: "Lucky", role: "trapmaker", time: "2:25" },
        { map: "Vector", role: "trapmaker", time: "1:08" },
        { map: "Lucky", role: "runner", time: "2:09" },
        { map: "Vector", role: "runner", time: "1:15" },
        { map: "Lucky", role: "trapmaker", time: "2:25" },
      ],
    };
  },

  methods: {
    createLobby() {
      // Логика создания лобби
    },

    joinLobby() {
      // Логика присоединения к лобби
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

    exitGame() {
      Modal.success({
        title: "Game Exited",
        content: "Thank you for playing!",
        okText: "OK",
        onOk: () => {
          this.$router.push("/");
        },
      });
    },
  },
};
</script>

<style scoped>
.header-panel {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 60px;
  z-index: 10;
}

.trophy-icon {
  font-size: 60px;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
  to {
    text-shadow: 0 2px 16px rgba(255, 215, 0, 0.8);
  }
}

.nickname-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.nickname-label {
  font-family: "Irish Grover", system-ui;
  font-size: 30px;
  color: #e5e5e5;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  background: rgb(0, 0, 0, 0.15);
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.create-lobby-page {
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
}

.create-lobby-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px 32px;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
