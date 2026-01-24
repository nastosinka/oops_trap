import { defineStore } from "pinia";
import { ref } from "vue";

export const useGameResultsStore = defineStore("gameResults", () => {
  const stats = ref([]);
  const mapId = ref(null);

  const setResults = (playersStats, map = null) => {
    stats.value = playersStats;
    mapId.value = map;
  };

  const clearResults = () => {
    stats.value = [];
  };

  return {
    stats,
    mapId,
    setResults,
    clearResults,
  };
});
