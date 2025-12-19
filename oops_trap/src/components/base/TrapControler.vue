<template>
    <div
      class="trap"
      :style="trapStyle"
    >
      <img :src="currentImage" class="trap-image" />
    </div>
  </template>
  
  <script>
  export default {
    name: "TrapNum3",
    props: {
      active: { type: Boolean, default: false },
      images: { type: Array, required: true },
      frameDuration: { type: Number, default: 500 },
      position: { type: Object, required: true },
      gameArea: { type: Object, required: true }
    },
    data() {
      return {
        currentFrame: 0,
        intervalId: null,
      };
    },
    computed: {
      currentImage() {
        return this.images[this.currentFrame];
      },
      trapStyle() {
        // Используем gameArea.scale и margin для точного позиционирования
        const scale = this.gameArea.scale || 1;
        return {
          position: "absolute",
          left: `${this.position.x * scale + this.gameArea.marginLeft}px`,
          top: `${this.position.y * scale + this.gameArea.marginTop}px`,
          width: `${64 * scale}px`,
          height: `${64 * scale}px`,
          zIndex: 10,
        };
      },
    },
    watch: {
      active(newVal) {
        if (newVal) this.startAnimation();
      },
    },
    methods: {
      startAnimation() {
        if (this.intervalId) return;
        this.currentFrame = 1;
        this.intervalId = setInterval(() => {
          if (this.currentFrame < this.images.length - 1) {
            this.currentFrame++;
          } else {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.$emit('activated', { type: 'poisonWater' });
          }
        }, this.frameDuration);
      },
    },
    beforeUnmount() {
      if (this.intervalId) clearInterval(this.intervalId);
    },
  };
  </script>
  
  <style scoped>
  .trap {
    position: absolute;
  }
  .trap-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  </style>
  