<template>
    <div class="results-page">
      <h1>Game Over</h1>
  
      <div class="results-summary">
        <p>Game ID: {{ gameId }}</p>
        <p>Your Role: {{ myRole }}</p>
        <p :class="isAlive ? 'alive' : 'dead'">
          {{ isAlive ? "You survived!" : "You died" }}
        </p>
      </div>
  
      <div class="players-results">
        <h2>Players Stats:</h2>
        <ul>
          <li
            v-for="player in playersStats"
            :key="player.id"
            :class="{
              alive: player.alive,
              dead: player.alive === false,
              mafia: player.role === 'mafia',
              runner: player.role === 'runner'
            }"
          >
            <img
              :src="player.role === 'mafia' ? mafiaImg : runnerImg"
              class="player-icon"
              :alt="player.role"
            />
            <strong>{{ player.name }}</strong> - 
            <span>{{ player.alive === null ? 'Finished' : player.alive ? 'Alive' : 'Dead' }}</span>
            <br/>
            <span>Time: {{ player.time !== null ? player.time + 's' : '-' }}</span>
            <span>Map: {{ player.map || '-' }}</span>
            <span>Role: {{ player.role }}</span>
          </li>
        </ul>
      </div>
  
      <div class="buttons">
        <button @click="goToLobby">Return to Lobby</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useUserStore } from '@/stores/user';
  import { storeToRefs } from 'pinia';
  
  import mafiaImg from '@/assets/images/1_T.png';
  import runnerImg from '@/assets/images/1_R.png';
  
  const router = useRouter();
  const route = useRoute();
  const userStore = useUserStore();
  const { userId, myRole, isAlive, ws } = storeToRefs(userStore);
  
  const gameId = computed(() => route.params.id || 1);
  
  const playersStats = ref([]);
  
  onMounted(() => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket не подключен!');
      return;
    }
  
    // Запрашиваем статистику
    ws.value.send(JSON.stringify({
      type: 'all_stats',
      gameId: gameId.value
    }));
  
    // Подписка на сообщения
    ws.value.addEventListener('message', handleMessage);
  });
  
  onBeforeUnmount(() => {
    if (ws.value) {
      ws.value.removeEventListener('message', handleMessage);
    }
  });
  
  function handleMessage(event) {
    const message = JSON.parse(event.data);
  
    if (message.type === 'all_stats' && message.stats) {
      // message.stats — это Map с id игрока -> {time, map, role}
      // Преобразуем в массив для рендера
      playersStats.value = Object.entries(message.stats).map(([id, stat]) => ({
        id,
        name: stat.name || `Player ${id}`,
        time: stat.time ?? null,
        map: stat.map ?? null,
        role: stat.role ? 'runner' : 'mafia',
        alive: stat.alive ?? true
      }));
    }
  }
  
  const goToLobby = () => {
    const lobbyId = route.query.lobbyId;
    if (lobbyId) {
      router.push(`/lobby?id=${lobbyId}&mode=join`);
    } else {
      router.push('/');
    }
  };
  </script>
  
  <style scoped>
  .results-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }
  
  .results-summary p {
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }
  
  .alive {
    color: green;
    font-weight: bold;
  }
  
  .dead {
    color: red;
    font-weight: bold;
    text-decoration: line-through;
  }
  
  .players-results {
    margin-top: 2rem;
    width: 100%;
    max-width: 600px;
  }
  
  .players-results ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
  
  .players-results li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid #ccc;
  }
  
  .players-results li.mafia {
    border-color: red;
  }
  
  .players-results li.runner {
    border-color: blue;
  }
  
  .player-icon {
    width: 40px;
    height: 40px;
  }
  
  .buttons {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
  }
  
  button {
    padding: 0.5rem 1.2rem;
    cursor: pointer;
    border-radius: 5px;
    border: none;
    font-weight: bold;
  }
  </style>
  