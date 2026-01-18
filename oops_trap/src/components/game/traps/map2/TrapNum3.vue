<template>
  <div class="trap-image" :class="{ active }" />
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.trap-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("@/assets/images/maps/Map2/tr3/1.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 3;
}

.trap-image.active {
  animation: trapAnim 0.75s steps(1) forwards;
  background-image: url("@/assets/images/maps/Map2/tr3/2.png");
  transition: opacity 0.2s ease;
}

@keyframes trapAnim {
  0% {
    background-image: url("@/assets/images/maps/Map2/tr3/1.png");
  }
  25% {
    background-image: url("@/assets/images/maps/Map2/tr3/3.png");
  }
  50% {
    background-image: url("@/assets/images/maps/Map2/tr3/4.png");
  }
  75%,
  100% {
    background-image: url("@/assets/images/maps/Map2/tr3/5.png");
  }
}
</style>
