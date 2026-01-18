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
  background-image: url("@/assets/images/maps/Map2/tr5/1.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  z-index: 3;
}

.trap-image.active {
  animation: trapAnim 1s steps(1) forwards;
}

@keyframes trapAnim {
  0% {
    background-image: url("@/assets/images/maps/Map2/tr5/1.png");
  }
  33% {
    background-image: url("@/assets/images/maps/Map2/tr5/2.png");
  }
  77%,
  100% {
    background-image: url("@/assets/images/maps/Map2/tr5/3.png");
  }
}
</style>
