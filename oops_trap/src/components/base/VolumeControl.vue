<template>
  <div class="volume-control">
    <label for="volume-slider">Volume:</label>
    <input
      id="volume-slider"
      v-model="volume"
      type="range"
      min="0"
      max="1"
      step="0.01"
      @input="updateVolume"
    />
    <span>{{ (volume * 100).toFixed(0) }}%</span>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { audioManager } from "@/utils/audioManager";

export default {
  name: "VolumeControl",

  setup() {
    const volume = ref(audioManager.masterGain.gain.value);

    const updateVolume = () => {
      audioManager.setMasterVolume(volume.value);
    };

    watch(volume, (newVolume) => {
      audioManager.setMasterVolume(newVolume);
    });

    return { volume, updateVolume };
  },
};
</script>

<style scoped>
.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "Irish Grover", system-ui;
  font-size: 20px;
  color: #ffcc00;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

input[type="range"] {
  width: 150px;
}

@media (min-width: 1200px) {
  input[type="range"] {
    width: 176px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  input[type="range"] {
    width: 146px;
  }
}

@media (max-width: 767px) {
  input[type="range"] {
    width: 85px;
  }
}

@media (max-width: 480px) {
  input[type="range"] {
    width: 85px;
  }
}
</style>
