<template>
  <div class="create-lobby-page">
    <div class="create-lobby-container">
      <div class="buttons-container">
          <BaseButton label="Rules" size="large" @click="showRulesModal = true" />
          <BaseButton
            size="large"
            label="Create a lobby"
            @click="createLobby"
          />
          <BaseButton size="large" label="Join the lobby" @click="joinLobby" />
          <BaseButton size="large" label="Exit" @click="showExitConfirm" />
      </div>
    </div>
  </div>

  <UniversalModal
      v-if="showRulesModal"
      title=""
      type="rules"
      @close="showRulesModal = false"
    />
  <div class="footer">Game Lobby v1.0</div>
</template>

<script>
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";
import { Modal } from 'ant-design-vue'

export default {
  name: "LobbyPage",

  components: {
    BaseButton,
    UniversalModal
  },

  data() {
    return {
      showRulesModal: false,
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
        title: 'Exit Game',
        content: 'Are you sure you want to exit the game?',
        okText: 'Yes, Exit',
        cancelText: 'Cancel',
        okType: 'danger',
        centered: true,
        onOk: () => {
          this.exitGame()
        }
      })
    },

    exitGame() {
      Modal.success({
        title: 'Game Exited',
        content: 'Thank you for playing!',
        okText: 'OK',
        onOk: () => {
          this.$router.push('/')
        }
      })
    },
  },
};
</script>

<style scoped>
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
  width: 100%;
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
