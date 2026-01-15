import { defineStore } from "pinia";
import { ref } from "vue";

export const useGameResultsStore = defineStore("gameResults", () => {
  // Массив игроков с их статистикой
  const stats = ref([]);

  // Карта игры (по желанию)
  const mapId = ref(null);

  // Сохраняем результаты
  const setResults = (playersStats, map = null) => {
    stats.value = playersStats;
    mapId.value = map;
  };

  // Сбрасываем результаты (если игрок возвращается в лобби)
  const clearResults = () => {
    stats.value = [];
    // mapId.value = null;
  };

  return {
    stats,
    mapId,
    setResults,
    clearResults,
  };
});
