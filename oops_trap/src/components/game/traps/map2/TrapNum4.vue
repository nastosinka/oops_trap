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
  background-image: url("@/assets/images/maps/Map2/tr4/1.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  z-index: 3;
}

.trap-image.active {
  animation: trapAnim 0.75s steps(1) forwards;
}

@keyframes trapAnim {
  0% {
    background-image: url("@/assets/images/maps/Map2/tr4/1.png");
  }
  33% {
    background-image: url("@/assets/images/maps/Map2/tr4/2.png");
  }
  77% {
    background-image: url("@/assets/images/maps/Map2/tr4/3.png");
  }
  100% {
    background-image: url("@/assets/images/maps/Map2/tr4/4.png");
  }
}
</style>
