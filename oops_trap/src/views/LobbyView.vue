<template>
  <div class="lobby">
    <div class="container">
      <div class="header">
        <h2>🚪 Игровое лобби</h2>
        <p>Ожидание игроков...</p>
      </div>
      
      <div class="players-grid">
        <div v-for="n in 4" :key="n" class="player-slot">
          <div class="player-avatar">👤</div>
          <span class="player-name">Игрок {{ n }}</span>
        </div>
      </div>
      
      <button @click="startGame" class="start-game-button">
        Начать игру
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const startGame = () => {
  router.push('/game')
}
</script>

<style scoped>
.lobby {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.container {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.header {
  margin-bottom: 40px;
}

.header h2 {
  font-size: 2rem;
  margin: 0 0 10px 0;
  color: white;
}

.header p {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 40px 0;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.player-slot {
  background: rgba(255,255,255,0.95);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.player-avatar {
  font-size: 2rem;
  margin-bottom: 10px;
}

.player-name {
  color: #333;
  font-weight: 500;
}

.start-game-button {
  background: #ff5e3a;
  color: white;
  border: none;
  padding: 16px 35px;
  border-radius: 12px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 30px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(255, 94, 58, 0.3);
  transition: all 0.3s ease;
}

.start-game-button:hover {
  background: #e05535;
  transform: translateY(-2px);
}

.start-game-button:active {
  transform: translateY(0);
}
</style>

