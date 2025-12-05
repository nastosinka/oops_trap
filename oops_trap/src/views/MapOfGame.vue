<template>
    <div class="game-screen">
      <GameContainer>
        <GameMap />
      </GameContainer>
    </div>
  </template>
  
  <script setup>
  import GameContainer from '@/components/game/maps/MapContainer.vue'
  import GameMap from '@/components/game/maps/background/FirstMapBackground.vue'
  </script>
  
  <style scoped>
  .game-screen {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #2c3e50;
    color: white;
    font-family: 'Segoe UI', Arial, sans-serif;
    position: fixed;
    margin: 0;
    padding: 0;
    top: 0;
    left: 0;
  }
  /* .mkf{
    z-index: 1000;
    top: 0;
    position: fixed;
  } */
  </style>