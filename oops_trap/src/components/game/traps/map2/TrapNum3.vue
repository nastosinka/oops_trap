<template>
  <img :src="currentImage" class="trap-image" />
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  type: String,
  active: Boolean,
  width: Number,
  height: Number,
});

const images = [
  new URL('@/assets/images/maps/Map2/tr3/1.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/2.png', import.meta.url).href,
  new URL('@/assets/images/maps/Map2/tr3/3.png', import.meta.url).href,
];

const currentFrame = ref(0);

const currentImage = computed(() => images[currentFrame.value]);
</script>

<style scoped>
.trap-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* теперь займет весь контейнер, который совпадает с картой */
  height: 100%;
  /* object-fit: contain; точно так же как st2-layer */
  z-index: 3;
  /* pointer-events: none; */
}
</style>