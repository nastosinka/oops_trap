<!-- пока что идея этого компонента в подстройке размеров экрана под действия пользователя -->
<template>
    <div class="game-container" ref="containerRef">
      <div class="game-content">
        <!-- сюда впихнём компонент с картой -->
        <slot></slot> 
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  
  const containerRef = ref(null)

  const updateContainerHeight = () => {
    if (!containerRef.value) return
    
    const container = containerRef.value
    const width = container.clientWidth
    const height = Math.round(width * 9 / 16) 
    
    container.style.height = `${height}px`
    
    if (height < window.innerHeight) {
      container.style.marginTop = `${(window.innerHeight - height) / 2}px`
    } else {
      container.style.marginTop = '0'
    }
  }
  
  onMounted(() => {
    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateContainerHeight)
  })
  </script>
  
  <style scoped>
  .game-container {
    width: 100%;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }
  
  .game-content {
    width: 100%;
    height: 100%;
    position: relative;
  }
  </style>