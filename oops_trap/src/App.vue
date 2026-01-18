<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { audioManager } from '@/utils/audioManager';
import backgroundMusic from '@/assets/music/background.mp3';

onMounted(async () => {
  await audioManager.load("background", backgroundMusic);
  
  // Разблокировка аудио по первому клику
  const unlock = async () => {
    await audioManager.unlock();
    audioManager.playMusic("background", { loop: true, volume: 0.3 });
    window.removeEventListener("click", unlock);
  };
  
  window.addEventListener("click", unlock);
});

onBeforeUnmount(() => {
  audioManager.stopMusic();
});
</script>

<style>
#app {
  font-family: "Segoe UI", Roboto, sans-serif;
}
</style>
