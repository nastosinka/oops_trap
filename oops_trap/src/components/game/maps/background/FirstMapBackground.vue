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
    <div
      class="map-layer st3-layer"
      :style="{ backgroundImage: `url(${st3})` }"
    ></div>
    <div
      class="map-layer st4-layer"
      :style="{ backgroundImage: `url(${st4})` }"
    ></div>
  </div>
</template>

<script setup>
import st1 from "@/assets/images/maps/Map1/st/st1.png";
import st2 from "@/assets/images/maps/Map1/st/st2.png";
import st3 from "@/assets/images/maps/Map1/st/st3.png";
import st4 from "@/assets/images/maps/Map1/st/st4.png";
</script>

<style scoped>
.game-map {
  position: absolute; /* Добавьте это! */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* Убедитесь, что фон ниже полигонов */
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
  pointer-events: none; /* Чтобы не мешали кликам */
}

.st1-layer {
  background-size: cover;
  z-index: 1;
}

.st2-layer {
  background-size: contain;
  z-index: 2;
}

.st3-layer {
  background-size: cover;
  z-index: 3;
}

.st4-layer {
  background-size: contain;
  z-index: 4;
}
</style>