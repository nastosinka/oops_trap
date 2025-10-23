import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/App.vue", () => ({
  default: {
    name: "MockApp",
    template: "<div>Mock App</div>",
  },
}));

vi.mock("@/router", () => ({
  default: {
    install: vi.fn(),
  },
}));

vi.mock("pinia", () => ({
  createPinia: () => ({ install: vi.fn() }),
}));

vi.mock("@vkontakte/vk-bridge", () => ({
  default: { send: vi.fn() },
}));

describe("main.js bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("initializes vkBridge and mounts app", async () => {
    const vkBridge = (await import("@vkontakte/vk-bridge")).default;
    const { createPinia } = await import("pinia");
    const router = (await import("@/router")).default;

    const { default: App } = await import("@/App.vue");
    await import("@/main.js");

    expect(vkBridge.send).toHaveBeenCalledWith("VKWebAppInit");
    expect(router.install).toHaveBeenCalled();
    expect(createPinia().install).toBeDefined();
    expect(App).toBeTruthy();
  });
});
