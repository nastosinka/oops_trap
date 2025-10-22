import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HomeView from "@/views/HomeView.vue";

describe("HomeView.vue", () => {
  it("renders home page with correct title", () => {
    const wrapper = mount(HomeView);

    expect(wrapper.text()).toContain("Oops Trap");
    expect(wrapper.text()).toContain("Асимметричная игра в VK");
  });

  it("has start game button", () => {
    const wrapper = mount(HomeView);

    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("Начать игру");
  });

  it("displays both game roles", () => {
    const wrapper = mount(HomeView);

    expect(wrapper.text()).toContain("Runner");
    expect(wrapper.text()).toContain("Trapmaker");
  });
});
