<template>
  <div class="create-lobby-page">
    <div class="header-panel">
      <div class="trophy-icon" @click="showStatsModal = true">
        <i class="mdi mdi-trophy"></i>
      </div>
      <div class="nickname-label">{{ userName }}</div>
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
    @close="showStatsModal = false"
  />

  <UniversalModal
    v-if="showJoinLobby"
    title="Join Lobby"
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
import { apiFetch } from "@/utils/api-auth.js";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { audioManager } from "@/utils/audioManager";

export default {
  name: "CreateLobbyPage",

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
      showRulesModal: false,
      showJoinLobby: false,
      showStatsModal: false,
      statsData: [],
      isLoadingStats: false,
    };
  },

  mounted() {
    if (audioManager.currentMusicName !== "background") {
      audioManager.playMusic("background", {
        loop: true,
        volume: 0.3,
      });
    }

    this.userStore.initializeUser();
    this.fetchStats();
  },

  methods: {
    async createLobby() {
      try {
        this.isLoadingStats = true;

        const response = await apiFetch("/api/lobby/newlobby", {
          method: "POST",
          credentials: "include",
          //body: JSON.stringify({ ownerId: this.userId }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${responseText}`
          );
        }

        const data = JSON.parse(responseText);
        console.log("Lobby created successfully:", data);

        this.$router.push(`/lobby?id=${data.id}&mode=create`);
      } catch (error) {
        Modal.error({
          title: "Failed to Create Lobby",
          content: error.message || "Unable to create lobby. Please try again.",
          okText: "OK",
        });
      } finally {
        this.isLoadingStats = false;
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
          this.exitGame();
        },
      });
    },

    exitGame() {
      this.userStore.logout();

      Modal.success({
        title: "Game Exited",
        content: "Thank you for playing!",
        okText: "OK",
        onOk: () => {
          this.$router.push("/");
        },
      });
    },

    async fetchStats() {
      try {
        const response = await fetch(`/api/stats/${this.userId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const processedData = data.map((item) => {
          const minutes = Math.floor(item.best_time / 60);
          const seconds = item.best_time % 60;
          const formattedTime = `${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;

          return {
            map: item.map_id,
            role: item.role,
            time: formattedTime,
          };
        });

        this.statsData = processedData;

        return processedData;
      } catch (error) {
        this.statsData = [];
        throw new Error(`Fetch error: ${error.message}`);
      }
    },

    async joinLobby(formData) {
      const lobbyCode = formData.lobbyCode;

      try {
        this.isLoadingStats = true;

        const lobbyId = parseInt(lobbyCode);
        if (isNaN(lobbyId)) {
          throw new Error("Please enter a valid lobby number");
        }

        const response = await fetch(`/api/lobby/lobbies/${lobbyId}/join`, {
          method: "POST",
          credentials: "include",
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(`Failed to join lobby: ${response.status}`);
        }

        const data = JSON.parse(responseText);
        console.log("Joined lobby:", data);

        this.$router.push(`/lobby?id=${lobbyId}&mode=join`);
      } catch (error) {
        Modal.error({
          title: "Cannot Join Lobby",
          content: error.message,
          okText: "OK",
        });
      } finally {
        this.isLoadingStats = false;
      }
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
    text-shadow: 0 2px 16px rgba(255, 215, 0, 1);
  }
}

.nickname-label {
  font-family: "Irish Grover", system-ui;
  font-size: 30px;
  color: #ffcc00;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  background: rgb(0, 0, 0, 0.15);
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  animation: glow 2s ease-in-out infinite alternate;
}

.create-lobby-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px 32px;
  width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 100%;
}

@media (max-width: 480px) {
  .create-lobby-container {
    padding: 32px 24px;
    max-width: 280px;
  }

  .buttons-container {
    gap: 14px;
  }
}

@media (min-width: 480px) {
  .create-lobby-container {
    padding: 32px 24px;
    max-width: 320px;
  }

  .buttons-container {
    gap: 14px;
  }
}

@media (min-width: 768px) {
  .create-lobby-container {
    max-width: 350px;
    padding: 45px 35px;
    border-radius: 14px;
  }

  .buttons-container {
    gap: 18px;
  }
}

@media (min-width: 1024px) {
  .create-lobby-container {
    max-width: 380px;
    padding: 50px 40px;
    border-radius: 16px;
  }

  .buttons-container {
    gap: 20px;
  }
}
</style>
