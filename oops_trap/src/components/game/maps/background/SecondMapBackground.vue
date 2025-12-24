<template>
  <div class="game-map">
    <div
      class="map-layer st11-layer"
      :style="{ backgroundImage: `url(${st11})` }"
    ></div>
    <div
      class="map-layer st12-layer"
      :style="{ backgroundImage: `url(${st12})` }"
    ></div>
    <div
      class="map-layer st2-layer"
      :style="{ backgroundImage: `url(${st2})` }"
    ></div>
  </div>
</template>

<script setup>
import st11 from "@/assets/images/maps/Map2/st/st11.png";
import st12 from "@/assets/images/maps/Map2/st/st12.png";
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

.st11-layer {
  background-size: cover;
  z-index: 0;
}

.st12-layer {
  background-size: cover;
  z-index: 50;
}


.st2-layer {
  background-size: contain;
  z-index: 60;
}
</style>
