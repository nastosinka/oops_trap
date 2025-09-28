<template>
  <div class="home">
    <div class="container">
      <div class="header">
        <h1>🎮 Oops Trap</h1>
        <p>Асимметричная игра в VK</p>
      </div>
      
      <div class="roles">
        <div class="role-card">
          <div class="role-icon">🏃</div>
          <h3>Runner</h3>
          <p>Убегай от ловушек</p>
        </div>
        <div class="role-card">
          <div class="role-icon">🕸️</div>
          <h3>Trapmaker</h3>
          <p>Расставляй ловушки</p>
        </div>
      </div>
      
      <button @click="goToLobby" class="start-button">
        Начать игру
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLobby = () => {
  router.push('/lobby')
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.header {
  margin-bottom: 50px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.header p {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.roles {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 50px 0;
  flex-wrap: wrap;
}

.role-card {
  background: white;
  border-radius: 20px;
  padding: 30px 20px;
  width: 180px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.role-card:hover {
  transform: translateY(-5px);
}

.role-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.role-card h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.3rem;
}

.role-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.start-button {
  background: #4bb34b;
  color: white;
  border: none;
  padding: 18px 40px;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 30px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(75, 179, 75, 0.3);
  transition: all 0.3s ease;
}

.start-button:hover {
  background: #3d9a3d;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 179, 75, 0.4);
}

.start-button:active {
  transform: translateY(0);
}

/* Мобильная адаптация */
@media (max-width: 600px) {
  .roles {
    gap: 20px;
  }
  
  .role-card {
    width: 140px;
    padding: 20px 15px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
}
</style>
