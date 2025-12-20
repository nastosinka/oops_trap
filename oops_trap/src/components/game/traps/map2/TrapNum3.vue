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
  new URL('@/assets/images/maps/Map2/tr3/1.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/2.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/3.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/4.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/5.png', import.meta.url).href,
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
