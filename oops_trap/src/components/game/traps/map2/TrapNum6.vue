<template>
    <img :src="currentImage" class="trap-image" />
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  
  const props = defineProps({
    type: String,
    active: Boolean,
  });
  
  const images = [
    new URL('@/assets/images/maps/Map2/tr6/1.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/2.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/3.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/4.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/5.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/6.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/7.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/8.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/9.png', import.meta.url).href,
    new URL('@/assets/images/maps/Map2/tr6/10.png', import.meta.url).href,
  ];
  
  const currentFrame = ref(0);
  const currentImage = computed(() => images[currentFrame.value]);
  </script>
  
  <style scoped>
  .trap-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;   /* теперь 100% берётся от game-map */
    height: 100%;  /* совпадает с картой */
    object-fit: contain;
    z-index: 3;
    pointer-events: none;
  }
  </style>