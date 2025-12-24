<template>
  <div class="game-map">
    <div class="map-layer main-layer" :style="{ backgroundImage: `url(${main})` }"></div>
    <div class="map-layer under-layer" :style="{ backgroundImage: `url(${walls})` }"></div>
    <div class="map-layer under-layer" :style="{ backgroundImage: `url(${crystals})` }"></div>
    <div class="map-layer under-layer" :style="{ backgroundImage: `url(${arrows})` }"></div>
  </div>
</template>

<script setup>
import main from "@/assets/images/maps/Map2/st/main.png";
import walls from "@/assets/images/maps/Map2/st/walls.png";
import crystals from "@/assets/images/maps/Map2/st/crystals.png";
import arrows from "@/assets/images/maps/Map2/st/arrows.png";
</script>

<style scoped>
.game-map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  /* Добавляем чтобы не мешали */
}

.main-layer {
  background-size: cover;
  z-index: 0;
}

.under-layer {
  background-size: cover;
  z-index: 50;
}
</style>
