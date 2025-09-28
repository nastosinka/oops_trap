<template>
  <div class="results">
    <div class="container">
      <div class="header">
        <h2>🏆 Результаты игры</h2>
        <p>Игра завершена!</p>
      </div>
      
      <div class="results-card">
        <div class="winner">
          <div class="trophy">🥇</div>
          <h3>Победитель: Runner</h3>
          <p>Время выживания: 2:30</p>
        </div>
        
        <div class="stats">
          <div class="stat">
            <span class="stat-value">4</span>
            <span class="stat-label">игроков</span>
          </div>
          <div class="stat">
            <span class="stat-value">12</span>
            <span class="stat-label">ловушек</span>
          </div>
          <div class="stat">
            <span class="stat-value">2:30</span>
            <span class="stat-label">время</span>
          </div>
        </div>
      </div>
      
      <button @click="goHome" class="home-button">
        В главное меню
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.results {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
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
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.header p {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.results-card {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  margin: 40px 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.winner {
  margin-bottom: 30px;
}

.trophy {
  font-size: 4rem;
  margin-bottom: 15px;
}

.winner h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.4rem;
}

.winner p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #0077ff;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.home-button {
  background: #0077ff;
  color: white;
  border: none;
  padding: 16px 35px;
  border-radius: 12px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0, 119, 255, 0.3);
  transition: all 0.3s ease;
}

.home-button:hover {
  background: #0055cc;
  transform: translateY(-2px);
}
</style>
