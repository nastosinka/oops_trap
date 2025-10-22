import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ResultsView from "@/views/ResultsView.vue";

describe("ResultsView.vue", () => {
  it("renders home page with correct title", () => {
    const wrapper = mount(ResultsView);

    expect(wrapper.text()).toContain("Результаты игры");
    expect(wrapper.text()).toContain("Игра завершена!");
  });

  it("has a button to return to the main menu", () => {
    const wrapper = mount(ResultsView);

    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("В главное меню");
  });

  it("displays results", () => {
    const wrapper = mount(ResultsView);

    expect(wrapper.text()).toContain("Победитель: Runner");
    expect(wrapper.text()).toContain("Время выживания: 2:30");
  });
});
