<template>
  <div class="game-screen" ref="screenRef">
    <div class="game-content" ref="gameContentRef">
      <GameMap />
      <RunnerTest ref="runnerTestRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import GameMap from '@/components/game/maps/background/FirstMapBackground.vue'
import RunnerTest from '@/components/game/RunnerTest.vue'

const screenRef = ref(null)
const gameContentRef = ref(null)
const runnerTestRef = ref(null)

// Передаем размеры игровой области вниз
const gameArea = ref({ width: 0, height: 0 })

const updateScreenSize = () => {
  if (!screenRef.value || !gameContentRef.value) return
  
  const width = window.innerWidth
  const height = Math.round(width * 9 / 16)
  
  // Устанавливаем размеры контейнера игры
  gameContentRef.value.style.width = `${width}px`
  gameContentRef.value.style.height = `${height}px`
  
  // Сохраняем размеры для передачи в RunnerTest
  gameArea.value = {
    width: width,
    height: height
  }
  
  // Центрируем по вертикали если есть место
  if (height < window.innerHeight) {
    const marginTop = (window.innerHeight - height) / 2
    gameContentRef.value.style.marginTop = `${marginTop}px`
    gameContentRef.value.style.marginLeft = '0'
  } else {
    gameContentRef.value.style.marginTop = '0'
    const gameWidth = Math.round(window.innerHeight * 16 / 9)
    gameContentRef.value.style.width = `${gameWidth}px`
    gameContentRef.value.style.marginLeft = `${(window.innerWidth - gameWidth) / 2}px`
    
    gameArea.value = {
      width: gameWidth,
      height: window.innerHeight
    }
  }
  
  // Сообщаем RunnerTest о новых размерах
  if (runnerTestRef.value && runnerTestRef.value.updateBounds) {
    runnerTestRef.value.updateBounds(gameArea.value);
  }
}

// Передаем размеры через provide/inject если нужно
provide('gameArea', gameArea)

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})

// Экспортируем функцию обновления для дочерних компонентов
defineExpose({
  updateScreenSize,
  getGameArea: () => gameArea.value
})
</script>

<style scoped>
.game-screen {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  background-color: #2c3e50;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.game-content {
  position: relative;
  background-color: #2c3e50;
  flex-shrink: 0;
}
</style>
