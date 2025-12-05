<template>
    <div class="game-screen" ref="screenRef">
      <div class="game-content">
        <GameMap />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import GameMap from '@/components/game/maps/background/FirstMapBackground.vue'
  
  const screenRef = ref(null)
  
  // Функция для поддержания соотношения 16:9
  const updateScreenSize = () => {
    if (!screenRef.value) return
    
    const screen = screenRef.value
    const gameContent = screen.querySelector('.game-content')
    
    if (!gameContent) return
    
    // Ширина = 100% окна
    const width = window.innerWidth
    
    // Высота = ширина * 9/16 (16:9)
    const height = Math.round(width * 9 / 16)
    
    // Устанавливаем размеры контейнера игры
    gameContent.style.width = `${width}px`
    gameContent.style.height = `${height}px`
    
    // Центрируем по вертикали если есть место
    if (height < window.innerHeight) {
      const marginTop = (window.innerHeight - height) / 2
      gameContent.style.marginTop = `${marginTop}px`
      gameContent.style.marginLeft = '0'
    } else {
      // Если высота больше окна - центрируем по горизонтали
      gameContent.style.marginTop = '0'
      const gameWidth = Math.round(window.innerHeight * 16 / 9)
      gameContent.style.width = `${gameWidth}px`
      gameContent.style.marginLeft = `${(window.innerWidth - gameWidth) / 2}px`
    }
  }
  
  onMounted(() => {
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize)
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
    background-color: #2c3e50; /* Фон если карта не загрузится */
    flex-shrink: 0; /* Не сжимаемся */
  }
  </style>