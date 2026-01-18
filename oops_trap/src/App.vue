<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  mounted() {
    // // Временный тест Sentry
    // if (Sentry) {
    //   Sentry.captureMessage("App.vue mounted - test message");
    //   Sentry.captureException(new Error("App.vue mounted - test error"));
    // }
  },
};
</script>

<script setup>
import { onMounted } from "vue";
import { audioManager } from "@/utils/audioManager";

import backgroundMusic from "@/assets/music/background.mp3";
import gameMusic from "@/assets/music/game-music.mp3";

onMounted(async () => {
  await audioManager.load("background", backgroundMusic);
  await audioManager.load("game", gameMusic);

  // разблокировка по первому клику
  const unlock = async () => {
    await audioManager.unlock();
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("click", unlock);
});
</script>

<style>
#app {
  font-family: "Segoe UI", Roboto, sans-serif;
}
</style>
