import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "@/App.vue";

vi.mock("@sentry/vue", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

// Мокаем аудио менеджер
vi.mock("@/tools/audioManager", () => ({
  audioManager: {
    load: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue(undefined),
    init: vi.fn(),
  },
}));

describe("App.vue", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it("renders without errors", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: "<div>Test Content</div>",
          },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("contains router view", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: "<div>Router View Content</div>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Router View Content");
  });
});
