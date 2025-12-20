<template>
  <div class="game-map">
    <div
      class="map-layer st1-layer"
      :style="{ backgroundImage: `url(${st1})` }"
    ></div>
    <div
      class="map-layer st2-layer"
      :style="{ backgroundImage: `url(${st2})` }"
    ></div>
  </div>
</template>

<script setup>
import st1 from "@/assets/images/maps/Map2/st/st1.png";
import st2 from "@/assets/images/maps/Map2/st/st2.png";
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
  pointer-events: none; /* Добавляем чтобы не мешали */
}

.st1-layer {
  background-size: cover;
  z-index: 2;
}

.st2-layer {
  background-size: contain;
  z-index: 3;
}
</style>