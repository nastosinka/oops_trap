<template>
    <div class="results-page">
      <h1 class="results-title">Game Results</h1>
  
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
  
      <button class="back-btn" @click="goHome">Back to Home</button>
    </div>
  </template>
  
  <script setup>
  import { computed } from "vue";
  import { useGameResultsStore } from "@/stores/gameResults";
  import { useUserStore } from "@/stores/user";
  import { useRouter } from "vue-router";
  
  const resultsStore = useGameResultsStore();
  const userStore = useUserStore();
  const router = useRouter();
  
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
        // Сначала игроки, которые достигли финиша
        if (a.time !== null && b.time !== null) return a.time - b.time;
        if (a.time !== null) return -1;
        if (b.time !== null) return 1;
        return 0;
      });
  });
  
  const goHome = () => {
    router.push("/");
  };
  </script>
  
  <style scoped>
  .results-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    min-height: 100vh;
    background: url("@/assets/images/background.jpg") center/cover no-repeat;
    color: white;
  }
  
  .results-title {
    font-family: "Irish Grover", cursive;
    font-size: 36px;
    margin-bottom: 20px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
  
  .stats-table-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
  }
  
  .stats-table-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.5);
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
    background: rgba(69,114,112);
    backdrop-filter: blur(5px);
  }
  
  .stats-table__row:nth-child(even) {
    background: rgba(255,255,255,0.05);
  }
  
  .stats-table__row:hover {
    background: rgba(0,0,0,0.1);
  }
  
  .stats-table__cell {
    padding: 12px 16px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    font-size: 18px;
  }
  
  .stats-table__cell--header {
    font-weight: bold;
    font-size: 22px;
    color: #ffd700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  .stats-table__cell--empty {
    font-style: italic;
    color: #ccc;
  }
  
  .back-btn {
    padding: 12px 24px;
    font-size: 18px;
    border-radius: 8px;
    border: none;
    background: #456e70;
    color: #ffd700;
    cursor: pointer;
    transition: 0.2s;
  }
  
  .back-btn:hover {
    background: #365256;
  }
  </style>
  