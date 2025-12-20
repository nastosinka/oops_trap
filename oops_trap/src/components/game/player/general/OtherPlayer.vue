<template>
    <div class="other-players-layer">
      <div 
        v-for="player in props.players" 
        :key="player.id"
        class="other-player"
        :style="getPlayerStyle(player)"
      >
        <!-- Тестовый элемент - виден всегда -->
        <div class="debug-marker"></div>
        <div class="player-name">{{ player.name || `Player ${player.id}` }}</div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, inject, onMounted } from "vue";
  
  const props = defineProps({
    players: { 
      type: Array, 
      default: () => [],
      required: true 
    }
  });
  
  const gameArea = inject('gameArea', { scale: 1 });
  
  onMounted(() => {
    console.log('🎮 OtherPlayers mounted. Players:', props.players);
  });
  
  const getPlayerStyle = (player) => {
    const scale = gameArea?.scale || 1;
    const x = player.x || 100;
    const y = player.y || 100;
    
    console.log(`🎯 Player ${player.id} at (${x}, ${y}) scale ${scale}`);
    
    return {
      position: 'absolute',
      left: `${Math.round(x * scale)}px`,
      top: `${Math.round(y * scale)}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: '99'
    };
  };
  </script>
  
  <style scoped>
  .other-players-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99;
  }
  
  .other-player {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* 🔥 ЯРКИЙ ТЕСТОВЫЙ МАРКЕР - ДОЛЖЕН БЫТЬ ВИДЕН! */
  .debug-marker {
    width: 40px;
    height: 40px;
    background-color: #ff0000;
    border: 3px solid #ffff00;
    border-radius: 50%;
    box-shadow: 0 0 15px #ff0000;
    animation: pulse 1s infinite;
  }
  
  .player-name {
    margin-top: 5px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 3px 10px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: bold;
    white-space: nowrap;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  </style>