<template>
  <div class="game-container">
    <canvas ref="canvas" width="800" height="600"></canvas>

    <div class="hud">
      <p>Time left: {{ timeLeft }}</p>
    </div>

    <div v-if="gameEnded" class="overlay">
      <h2>Game Over</h2>
      <ul>
        <li v-for="stat in stats" :key="stat.userId">
          Player {{ stat.userId }} — {{ stat.score }} points
        </li>
      </ul>
      <button @click="exitToMenu">Exit</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const gameId = 1; // получить из маршрута
const userId = 2; // получить из auth

const ws = ref(null);
const timeLeft = ref(0);
const stats = ref([]);
const gameEnded = ref(false);

onMounted(() => {
  ws.value = new WebSocket('ws://localhost/ws/game');

  ws.value.onopen = () => {
    ws.value.send(JSON.stringify({ type: 'join', gameId, userId }));
  };

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'GAME_START':
        timeLeft.value = data.payload.timeLeft;
        break;
      case 'TICK':
        timeLeft.value = data.payload.timeLeft;
        break;
      case 'GAME_END':
        stats.value = data.payload.stats;
        gameEnded.value = true;
        break;
    }
  };
});

onUnmounted(() => {
  ws.value?.close();
});

function exitToMenu() {
  ws.value?.close();
  window.location.href = '/lobbies';
}
</script>
