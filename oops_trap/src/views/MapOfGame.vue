<template>
  <div class="game-screen" ref="screenRef">
    <div class="game-content" ref="gameContentRef">
      <!-- <GameMap1 /> -->
      <GameMap2 />
      <RunnerTest ref="runnerTestRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import GameMap1 from '@/components/game/maps/background/FirstMapBackground.vue'
import GameMap2 from '@/components/game/maps/background/SecondMapBackground.vue'
import RunnerTest from '@/components/game/RunnerTest.vue'

const screenRef = ref(null)
const gameContentRef = ref(null)
const runnerTestRef = ref(null)

// Базовое (референсное) разрешение игры
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

const gameArea = ref({ 
    width: 0, 
    height: 0,
    scale: 1,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT
})

// Дебаунс для ресайза
let resizeTimeout

const updateScreenSize = () => {
    if (!screenRef.value || !gameContentRef.value) return
    
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    // Рассчитываем размеры для 16:9
    let gameWidth, gameHeight, marginTop = 0, marginLeft = 0
    
    // Вариант 1: Высота больше ширины (узкое окно)
    if (windowWidth / windowHeight < 16/9) {
        // Ограничиваем по ширине, черные полосы сверху/снизу
        gameWidth = windowWidth
        gameHeight = Math.round(gameWidth * 9 / 16)
        marginTop = (windowHeight - gameHeight) / 2
    } 
    // Вариант 2: Ширина больше высоты (широкое окно)
    else {
        // Ограничиваем по высоте, черные полосы по бокам
        gameHeight = windowHeight
        gameWidth = Math.round(gameHeight * 16 / 9)
        marginLeft = (windowWidth - gameWidth) / 2
    }
    
    // Устанавливаем размеры и отступы
    gameContentRef.value.style.width = `${gameWidth}px`
    gameContentRef.value.style.height = `${gameHeight}px`
    gameContentRef.value.style.marginTop = `${marginTop}px`
    gameContentRef.value.style.marginLeft = `${marginLeft}px`
    
    // Вычисляем масштаб (относительно базового размера)
    const scale = gameWidth / BASE_WIDTH
    
    // Обновляем реактивные данные
    gameArea.value = {
        width: gameWidth,
        height: gameHeight,
        scale: scale,
        baseWidth: BASE_WIDTH,
        baseHeight: BASE_HEIGHT,
        marginTop: marginTop,
        marginLeft: marginLeft
    }
    
    console.log('🎮 Игровая область обновлена:', {
        размеры: `${gameWidth}x${gameHeight}`,
        масштаб: scale.toFixed(3),
        окно: `${windowWidth}x${windowHeight}`,
        отступы: `top: ${marginTop}px, left: ${marginLeft}px`
    })
    
    // Передаем данные в RunnerTest
    if (runnerTestRef.value && typeof runnerTestRef.value.updateGameArea === 'function') {
        runnerTestRef.value.updateGameArea(gameArea.value)
    }
}

// Обработчик ресайза с дебаунсом
const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateScreenSize, 50) // 50мс дебаунс
}

onMounted(() => {
    updateScreenSize()
    window.addEventListener('resize', handleResize)
    
    // Передаем gameArea через provide для вложенных компонентов
    provide('gameArea', gameArea)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimeout)
})

// Экспортируем методы для внешнего доступа
defineExpose({
    updateScreenSize,
    getGameArea: () => gameArea.value,
    getScale: () => gameArea.value.scale
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
    background-color: #000000; /* Черные полосы */
    overflow: hidden;
}

.game-content {
    position: relative;
    background-color: #2c3e50;
    transition: all 0.3s ease; /* ← Вот и вся плавность! */
}
</style>