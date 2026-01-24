import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GameMap from "@/components/game/maps/background/SecondMapBackground.vue";

// Мокаем импорты
const mockImages = {
  main: "main.png",
  walls: "walls.png",
  crystals: "crystals.png",
  arrows: "arrows.png",
};

describe("SecondMapBackground Component", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(GameMap);
  });

  describe("Рендеринг", () => {
    it("рендерит контейнер карты", () => {
      expect(wrapper.find(".game-map").exists()).toBe(true);
    });

    it("рендерит все 4 слоя", () => {
      expect(wrapper.findAll(".map-layer")).toHaveLength(4);
    });

    it("имеет правильные классы для слоев", () => {
      expect(wrapper.find(".main-layer").exists()).toBe(true);
      expect(wrapper.findAll(".under-layer")).toHaveLength(3);
    });
  });

  describe("Фоновые изображения", () => {
    it("применяет правильные изображения для каждого слоя", () => {
      const layers = wrapper.findAll(".map-layer");

      expect(layers[0].attributes("style")).toContain(mockImages.main);
      expect(layers[1].attributes("style")).toContain(mockImages.walls);
      expect(layers[2].attributes("style")).toContain(mockImages.crystals);
      expect(layers[3].attributes("style")).toContain(mockImages.arrows);
    });

    it("использует background-image для всех слоев", () => {
      wrapper.findAll(".map-layer").forEach((layer) => {
        const style = layer.attributes("style");
        expect(style).toContain("background-image");
        expect(style).toContain("url(");
      });
    });
  });
});
