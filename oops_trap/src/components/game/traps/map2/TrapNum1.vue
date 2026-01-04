<template>
  <div
    class="trap-image"
    :class="{ active }"
  />
</template>

<script setup>
const props = defineProps({
  type: String,
  active: Boolean,
});
</script>

<style scoped>
.trap-image {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

.trap-image.active {
  opacity: 1;
}

.trap-image::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url("@/assets/images/maps/Map2/tr1/1.png") center / contain no-repeat;
  opacity: 0;
}

.trap-image.active::before {
  opacity: 1;
}


.trap-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: url("@/assets/images/maps/Map2/tr1/2.png") center / contain no-repeat;
  opacity: 0;
}

.trap-image.active::after {
  animation: showSecond 2s forwards;
}

@keyframes showSecond {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
</style>
