<template>
  <div class="test-container">
    <h1>Тест проверки координат на сервере</h1>

    <div class="coords">
      <p>Локальные координаты: X={{ x }}, Y={{ y }}</p>
      <p>Ответ сервера: {{ serverResponse }}</p>
    </div>

    <div class="buttons">
      <button @click="move(0, -5)">Вверх</button>
      <button @click="move(0, 5)">Вниз</button>
      <button @click="move(-5, 0)">Влево</button>
      <button @click="move(5, 0)">Вправо</button>
    </div>

    <p>Status: {{ wsStatus }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const ws = ref(null);
const wsStatus = ref("Connecting...");

const x = ref(100);
const y = ref(100);

const serverResponse = ref("");

onMounted(() => {
  ws.value = new WebSocket("ws://localhost/ws/game/1");

  ws.value.onopen = () => {
    wsStatus.value = "Connected";

    // отправляем init только один раз
    ws.value.send(JSON.stringify({
      type: "init",
      gameId: 1,
      playerId: 999,
      isHost: false
    }));
  };

  ws.value.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    // если сервер запрещает движение — откат
    if (msg.type === "rollback") {
      x.value = msg.x;
      y.value = msg.y;
      serverResponse.value = "Столкновение!";
    }

    // если движение успешно
    if (msg.type === "coord_message") {
      serverResponse.value = "OK";

      const me = msg.coords.find(p => p.id === 999);
      if (me) {
        x.value = me.x;
        y.value = me.y;
      }
    }
  };

  ws.value.onerror = () => wsStatus.value = "Error";
  ws.value.onclose = () => wsStatus.value = "Closed";
});

onUnmounted(() => {
  if (ws.value) ws.value.close();
});

function move(dx, dy) {
  x.value += dx;
  y.value += dy;

  ws.value.send(
    JSON.stringify({
      type: "player_move",
      playerId: 999,
      gameId: 1,
      position: {
        x: x.value,
        y: y.value
      }
    })
  );
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  font-family: Arial;
}
.buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
}
.coords {
  margin-bottom: 20px;
}
</style>
