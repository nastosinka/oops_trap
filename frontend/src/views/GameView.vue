<template>
  <div class="game">
    <div class="container">
      <div class="header">
        <h2>🎯 Игровой экран</h2>
        <p>Игра началась!</p>
      </div>
      
      <div class="game-area">
        <div class="canvas-placeholder">
          <span>Игровое поле будет здесь</span>
        </div>
      </div>
      
      <button @click="goToResults" class="results-button">
        Завершить игру
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToResults = () => {
  router.push('/results')
}
</script>

<style scoped>
.game {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 20px;
}

.container {
  text-align: center;
  max-width: 600px;
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

.game-area {
  margin: 40px 0;
}

.canvas-placeholder {
  background: rgba(255,255,255,0.1);
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 15px;
  padding: 60px 20px;
  color: white;
  font-size: 1.1rem;
}

.results-button {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 16px 35px;
  border-radius: 12px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 30px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
  transition: all 0.3s ease;
}

.results-button:hover {
  background: #8e44ad;
  transform: translateY(-2px);
}
</style>
