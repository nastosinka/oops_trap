import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useGameResultsStore } from "@/stores/gameResults.js";

describe("GameResults Store", () => {
  beforeEach(() => {
    // Создаем новый экземпляр Pinia для каждого теста
    setActivePinia(createPinia());
  });

  // Пример данных для тестирования
  const mockPlayersStats = [
    { id: 1, name: "Player 1", kills: 5, deaths: 2, score: 1000 },
    { id: 2, name: "Player 2", kills: 3, deaths: 5, score: 800 },
    { id: 3, name: "Player 3", kills: 0, deaths: 10, score: 300 },
  ];

  const mockMapId = "de_dust2";

  describe("Initial state", () => {
    it("should have empty stats array initially", () => {
      const store = useGameResultsStore();
      expect(store.stats).toEqual([]);
    });

    it("should have null mapId initially", () => {
      const store = useGameResultsStore();
      expect(store.mapId).toBeNull();
    });
  });

  describe("setResults", () => {
    it("should set player stats correctly", () => {
      const store = useGameResultsStore();
      store.setResults(mockPlayersStats);

      expect(store.stats).toEqual(mockPlayersStats);
      expect(store.stats).toHaveLength(3);
      expect(store.stats[0]).toEqual(mockPlayersStats[0]);
      expect(store.stats[1].name).toBe("Player 2");
      expect(store.stats[2].score).toBe(300);
    });

    it("should set mapId when provided", () => {
      const store = useGameResultsStore();
      store.setResults(mockPlayersStats, mockMapId);

      expect(store.mapId).toBe(mockMapId);
    });

    it("should handle empty players array", () => {
      const store = useGameResultsStore();
      store.setResults([]);

      expect(store.stats).toEqual([]);
      expect(store.stats).toHaveLength(0);
    });

    it("should set mapId to null when not provided", () => {
      const store = useGameResultsStore();
      store.setResults(mockPlayersStats);

      expect(store.mapId).toBeNull();
    });

    it("should override previous results", () => {
      const store = useGameResultsStore();

      // Первый вызов
      store.setResults(mockPlayersStats, mockMapId);
      expect(store.stats).toEqual(mockPlayersStats);
      expect(store.mapId).toBe(mockMapId);

      // Второй вызов с другими данными
      const newStats = [
        { id: 4, name: "New Player", kills: 10, deaths: 0, score: 2000 },
      ];
      const newMap = "de_inferno";
      store.setResults(newStats, newMap);

      expect(store.stats).toEqual(newStats);
      expect(store.stats).toHaveLength(1);
      expect(store.mapId).toBe(newMap);
    });
  });

  describe("clearResults", () => {
    it("should clear player stats", () => {
      const store = useGameResultsStore();

      // Устанавливаем данные
      store.setResults(mockPlayersStats, mockMapId);
      expect(store.stats).toEqual(mockPlayersStats);

      // Очищаем
      store.clearResults();

      expect(store.stats).toEqual([]);
      expect(store.stats).toHaveLength(0);
    });

    it("should not clear mapId (as per commented code)", () => {
      const store = useGameResultsStore();

      // Устанавливаем данные
      store.setResults(mockPlayersStats, mockMapId);
      expect(store.mapId).toBe(mockMapId);

      // Очищаем
      store.clearResults();

      // mapId должен остаться прежним, так как закомментировано
      expect(store.mapId).toBe(mockMapId);
    });

    it("should work on already empty store", () => {
      const store = useGameResultsStore();

      // Проверяем начальное состояние
      expect(store.stats).toEqual([]);

      // Очищаем (ничего не должно сломаться)
      expect(() => store.clearResults()).not.toThrow();

      // Проверяем, что всё ещё пусто
      expect(store.stats).toEqual([]);
    });
  });

  // Дополнительные интеграционные тесты
  describe("Integration", () => {
    it("should handle setResults -> clearResults -> setResults sequence", () => {
      const store = useGameResultsStore();

      // Первое сохранение
      store.setResults(mockPlayersStats, mockMapId);
      expect(store.stats).toEqual(mockPlayersStats);
      expect(store.mapId).toBe(mockMapId);

      // Очистка
      store.clearResults();
      expect(store.stats).toEqual([]);
      expect(store.mapId).toBe(mockMapId); // mapId остаётся

      // Новое сохранение
      const newPlayer = {
        id: 10,
        name: "Solo Player",
        kills: 1,
        deaths: 1,
        score: 500,
      };
      store.setResults([newPlayer], "de_nuke");

      expect(store.stats).toEqual([newPlayer]);
      expect(store.stats).toHaveLength(1);
      expect(store.mapId).toBe("de_nuke");
    });
  });
});
