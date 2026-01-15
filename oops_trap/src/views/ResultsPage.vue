<template>
  <div class="results-page">
    <h1 class="results-title" :class="{
      'results-title--win': playerResult.status === 'win',
      'results-title--lose': playerResult.status === 'lose',
    }">
      {{ playerResult.text }}
    </h1>


    <div class="stats-table-wrapper">
      <table class="stats-table">
        <thead class="stats-table__header">
          <tr>
            <th class="stats-table__cell stats-table__cell--header">Player</th>
            <th class="stats-table__cell stats-table__cell--header">Role</th>
            <th class="stats-table__cell stats-table__cell--header">Time</th>
            <th class="stats-table__cell stats-table__cell--header">Result</th>
          </tr>
        </thead>
        <tbody class="stats-table__body">
          <tr v-for="player in sortedPlayers" :key="player.id" class="stats-table__row">
            <td class="stats-table__cell">{{ player.name }}</td>
            <td class="stats-table__cell">{{ player.role }}</td>
            <td class="stats-table__cell">
              {{ player.time !== null ? player.time + "s" : "-" }}
            </td>
            <td class="stats-table__cell">{{ player.result }}</td>
          </tr>

          <tr v-if="sortedPlayers.length === 0" class="stats-table__row">
            <td colspan="4" class="stats-table__cell stats-table__cell--empty">
              No statistics available
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseButton label="Back to Lobby" @click="returnToLobby" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useGameResultsStore } from "@/stores/gameResults";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
import { Modal } from "ant-design-vue";
import BaseButton from "@/components/base/BaseButton.vue";
import { useRoute } from "vue-router";

const route = useRoute();

const resultsStore = useGameResultsStore();
const userStore = useUserStore();
const router = useRouter();

// Если есть флаги активности игры и роль хоста
const isGameActive = computed(() => resultsStore.isActive || false);
const lobbyId = computed(() => route.query.lobbyId);
const isHost = computed(() => userStore.myRole === "host");

// Функция обновления статуса лобби
// const updateLobbyStatus = async (newStatus) => {
//   try {
//     const response = await fetch(`/api/lobby/lobbies/${lobbyId.value}/status`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ newStatus }),
//       credentials: "include",
//     });

//     if (!response.ok) throw new Error(`HTTP ${response.status}`);
//     return await response.json();
//   } catch (error) {
//     console.error("Error updating lobby status:", error);
//     throw error;
//   }
// };

/**
 * Формируем таблицу с результатами
 * Правила:
 * 1. Мафия побеждает, если все игроки (кроме мафии) умерли
 * 2. Все мертвые или не достигшие финиша игроки — проиграли
 * 3. Игроки, достигшие финиша — сортируются по времени
 */
const sortedPlayers = computed(() => {
  const stats = resultsStore.stats.map((p) => ({ ...p }));

  const allDead = stats.every((p) => p.role === "mafia" || !p.alive || p.time === null);

  return stats
    .map((p) => {
      if (p.role === "mafia") {
        p.result = allDead ? "Won 🎉" : "Lost ❌";
      } else if (!p.alive || p.time === null) {
        p.result = "Lost ❌";
      } else {
        p.result = "Finished 🏁";
      }
      return p;
    })
    .sort((a, b) => {
      if (a.time !== null && b.time !== null) return a.time - b.time;
      if (a.time !== null) return -1;
      if (b.time !== null) return 1;
      return 0;
    });
});

// Результат текущего пользователя
const playerResult = computed(() => {
  const myId = String(userStore.userId);

  const me = sortedPlayers.value.find(
    (p) => String(p.id) === myId
  );

  if (!me) {
    return {
      text: "Game Results",
      status: "neutral",
    };
  }

  if (me.result.includes("Won")) {
    return {
      text: "You Win",
      status: "win",
    };
  }

  return {
    text: "You Lose",
    status: "lose",
  };
});



// Переход в лобби
const returnToLobby = async () => {
  userStore.setIsAlive(true);

  // 🔥 ВАЖНО: закрываем сокет
  const socket = userStore.gameSocket;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "Leaving game");
  }

  if (!lobbyId.value) {
    Modal.error({
      title: "Cannot Return to Lobby",
      content: "Lobby information is not available",
    });
    return;
  }

  // try {
  //   if (isHost.value) {
  //     await updateLobbyStatus("waiting");
  //   }
  // } catch (error) {
  //   Modal.error({
  //     title: "Lobby Update Error",
  //     content: "Failed to update lobby status",
  //   });
  //   return;
  // }

  router.replace(`/lobby?id=${lobbyId.value}&mode=join`);
};

</script>

  
<style scoped>
.results-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  background: url("@/assets/images/background.jpg") center/cover no-repeat;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  color: white;
}

.results-title {
  font-family: "Irish Grover", cursive;
  font-size: 36px;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.stats-table-wrapper {
  width: 90%;
  max-width: 700px;
  background: rgba(69, 114, 112, 0.3);
  border-radius: 8px;
  overflow-y: auto;
  margin-bottom: 30px;
}

.stats-table-wrapper::-webkit-scrollbar {
  width: 6px;
}

.stats-table-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.stats-table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.stats-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Irish Grover", system-ui;
  color: white;
}

.stats-table__header {
  position: sticky;
  top: 0;
  background: rgba(69, 114, 112);
  backdrop-filter: blur(5px);
}

.stats-table__row:nth-child(even) {
  background: rgba(255, 255, 255, 0.05);
}

.stats-table__row:hover {
  background: rgba(0, 0, 0, 0.1);
}

.stats-table__cell {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 18px;
}

.stats-table__cell--header {
  font-weight: bold;
  font-size: 22px;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.stats-table__cell--empty {
  font-style: italic;
  color: #ccc;
}

.results-title {
  font-family: "Irish Grover", cursive;
  font-size: 42px;
  margin-bottom: 24px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  transition: color 0.3s ease;
}

.results-title--win {
  color: #ffd700;
}

.results-title--lose {
  color: #e74c3c;
}

</style>
  