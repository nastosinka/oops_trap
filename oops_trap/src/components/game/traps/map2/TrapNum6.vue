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
  background-image: url("@/assets/images/maps/Map2/tr6/1.png");
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
    background-image: url("@/assets/images/maps/Map2/tr6/1.png");
  }
  10% {
    background-image: url("@/assets/images/maps/Map2/tr6/2.png");
  }
  20% {
    background-image: url("@/assets/images/maps/Map2/tr6/3.png");
  }
  30% {
    background-image: url("@/assets/images/maps/Map2/tr6/4.png");
  }
  40% {
    background-image: url("@/assets/images/maps/Map2/tr6/5.png");
  }
  50% {
    background-image: url("@/assets/images/maps/Map2/tr6/6.png");
  }
  60% {
    background-image: url("@/assets/images/maps/Map2/tr6/7.png");
  }
  70% {
    background-image: url("@/assets/images/maps/Map2/tr6/8.png");
  }
  80% {
    background-image: url("@/assets/images/maps/Map2/tr6/9.png");
  }
  81%,
  100% {
    background-image: url("@/assets/images/maps/Map2/tr6/10.png");
  }
}
</style>
