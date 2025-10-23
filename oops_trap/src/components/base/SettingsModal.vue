<template>
  <div class="settings-modal">
    <div class="setting-group">
      <div class="setting-header">
        <span class="setting-title">map type</span>
      </div>
      <div class="select-wrapper">
        <select v-model="selectedMap" class="setting-select">
          <option value="" disabled>select map type</option>
          <option v-for="map in mapTypes" :key="map.value" :value="map.value">
            {{ map.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-header">
        <span class="setting-title">mafia</span>
      </div>
      <div class="select-wrapper">
        <select v-model="selectedMafia" class="setting-select">
          <option value="" disabled>select mafia</option>
          <option v-for="player in players" :key="player.id" :value="player.id">
            {{ player.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-header">
        <span class="setting-title">time</span>
      </div>
      <div class="select-wrapper">
        <select v-model="selectedTime" class="setting-select">
          <option value="" disabled>select time</option>
          <option
            v-for="timeOption in timeOptions"
            :key="timeOption.value"
            :value="timeOption.value"
          >
            {{ timeOption.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="settings-actions">
      <BaseButton label="Apply" size="large" @click="handleApply" />
    </div>
  </div>
</template>

<script>
import BaseButton from "@/components/base/BaseButton.vue";

export default {
  name: "SettingsModal",
  components: {
    BaseButton,
  },
  props: {
    players: {
      type: Array,
      default: () => [],
    },
    initialSettings: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      selectedMap: "",
      selectedMafia: "",
      selectedTime: "",
      mapTypes: [
        { value: "city", label: "city" },
        { value: "village", label: "village" },
        { value: "forest", label: "forest" },
        { value: "desert", label: "desert" },
      ],
      timeOptions: [
        { value: "slow", label: "slow" },
        { value: "normal", label: "normal" },
        { value: "quick", label: "quick" },
      ],
    };
  },
  created() {
    if (this.initialSettings.map) {
      this.selectedMap = this.initialSettings.map;
    }
    if (this.initialSettings.mafia) {
      this.selectedMafia = this.initialSettings.mafia;
    }
    if (this.initialSettings.time) {
      this.selectedTime = this.initialSettings.time;
    }
  },
  methods: {
    handleApply() {
      // const settings = {
      //   map: this.selectedMap,
      //   mafia: this.selectedMafia,
      //   time: this.selectedTime,
      // };
      // this.$emit("apply", settings);
    },
  },
};
</script>

<style scoped>
.settings-modal {
  padding: 20px 0;
}

.setting-group {
  margin-bottom: 40px;
}

.setting-header {
  margin-bottom: 16px;
}

.setting-title {
  font-size: 24px;
  color: #ffcc00;
  font-family: "Irish Grover", system-ui;
  text-transform: lowercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.select-wrapper {
  position: relative;
}

.setting-select {
  width: 100%;
  padding: 16px 20px;
  background: rgba(69, 114, 112, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-family: "Irish Grover", system-ui;
  outline: none;
  transition: all 0.2s ease-in-out;
  text-transform: lowercase;
}

.setting-select:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(69, 114, 112, 0.9);
}

.setting-select option {
  background: rgba(40, 75, 99, 0.9);
  color: white;
  padding: 12px;
  font-family: "Irish Grover", system-ui;
  text-transform: lowercase;
}

.setting-select[multiple] {
  height: 140px;
  resize: vertical;
}

.settings-actions {
  margin-top: 50px;
  display: flex;
  justify-content: center;
}

.setting-select[multiple]::-webkit-scrollbar {
  width: 8px;
}

.setting-select[multiple]::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.setting-select[multiple]::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.setting-select[multiple]::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
