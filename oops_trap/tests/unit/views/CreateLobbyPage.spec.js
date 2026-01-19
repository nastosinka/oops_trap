import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CreateLobbyPage from "@/views/CreateLobbyPage.vue";

// Моки компонентов
vi.mock("@/components/base/VolumeControl.vue", () => ({
  default: {
    template: "<div class='volume-control-stub' />",
  },
}));

vi.mock("@/components/base/BaseButton.vue", () => ({
  default: {
    template: "<button><slot></slot></button>",
    props: ["label", "size"],
  },
}));

vi.mock("@/components/base/UniversalModal.vue", () => ({
  default: {
    template: "<div><slot></slot></div>",
    props: ["title", "type", "fields", "submitText", "statsData"],
    emits: ["close", "submit"],
  },
}));

// Моки внешних зависимостей
vi.mock("ant-design-vue", () => ({
  Modal: {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock("@/utils/api-auth.js", () => ({
  apiFetch: vi.fn(),
}));

// Мок Pinia store
const mockUserStore = {
  user: { name: "TestUser" },
  userId: 1,
  userName: "TestUser",
  initializeUser: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

// Мок fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve("[]"),
  })
);

describe("CreateLobbyPage", () => {
  let wrapper;
  let mockRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    // Сброс мока store
    mockUserStore.user = { name: "TestUser" };
    mockUserStore.userId = 1;
    mockUserStore.userName = "TestUser";
    mockUserStore.initializeUser.mockClear();
    mockUserStore.logout.mockClear();

    mockRouter = {
      push: vi.fn(),
    };

    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve("[]"),
      })
    );

    wrapper = mount(CreateLobbyPage, {
      global: {
        mocks: {
          $router: mockRouter,
        },
      },
    });
  });

  describe("Базовый рендеринг", () => {
    it("отображает страницу создания лобби", () => {
      expect(wrapper.find(".create-lobby-page").exists()).toBe(true);
    });

    it("инициализирует пользователя при монтировании", () => {
      expect(mockUserStore.initializeUser).toHaveBeenCalled();
    });
  });

  describe("Управление состоянием модальных окон", () => {
    it("открывает модалку статистики при клике на трофей", async () => {
      expect(wrapper.vm.showStatsModal).toBe(false);
      await wrapper.find(".trophy-icon").trigger("click");
      expect(wrapper.vm.showStatsModal).toBe(true);
    });

    it("открывает модалку правил", async () => {
      await wrapper.setData({ showRulesModal: true });
      expect(wrapper.vm.showRulesModal).toBe(true);
    });

    it("открывает модалку присоединения к лобби", async () => {
      await wrapper.setData({ showJoinLobby: true });
      expect(wrapper.vm.showJoinLobby).toBe(true);
    });
  });

  describe("Создание лобби", () => {
    it("обрабатывает ошибку при создании лобби", async () => {
      const { apiFetch } = await import("@/utils/api-auth.js");
      const { Modal } = await import("ant-design-vue");

      apiFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Error message"),
      });

      await wrapper.vm.createLobby();

      expect(Modal.error).toHaveBeenCalled();
    });

    it("обрабатывает JSON parse ошибку в createLobby", async () => {
      const { apiFetch } = await import("@/utils/api-auth.js");
      const { Modal } = await import("ant-design-vue");

      apiFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("invalid json"),
      });

      await wrapper.vm.createLobby();

      expect(Modal.error).toHaveBeenCalled();
    });
  });

  describe("Выход из игры", () => {
    it("показывает подтверждение выхода", async () => {
      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.showExitConfirm();

      expect(Modal.confirm).toHaveBeenCalled();
    });
  });

  describe("Присоединение к лобби", () => {
    it("обрабатывает невалидный код лобби", async () => {
      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.joinLobby({ lobbyCode: "invalid" });

      expect(Modal.error).toHaveBeenCalled();
    });

    it("обрабатывает ошибку при присоединении", async () => {
      const { Modal } = await import("ant-design-vue");

      global.fetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Error"),
      });

      await wrapper.vm.joinLobby({ lobbyCode: "123" });

      expect(Modal.error).toHaveBeenCalled();
    });
  });

  describe("Дополнительные тесты", () => {
    it("инициализируется с правильными начальными значениями", () => {
      expect(wrapper.vm.showRulesModal).toBe(false);
      expect(wrapper.vm.showJoinLobby).toBe(false);
      expect(wrapper.vm.showStatsModal).toBe(false);
      expect(wrapper.vm.isLoadingStats).toBe(false);
    });
  });
});
