<template>
    <div class="game-map" :style="{ backgroundImage: `url(${mapImage})` }"></div>
</template>
  
<script setup>
// защищаем структуру проекта, после сборки vite закодирует картинки и пользователю без знания устройства проекта будет сложно что-то изменить
import mapImage from '@/assets/images/maps/Map1/st/st1.png'
</script>
  
<style scoped>
.game-map {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}
</style>