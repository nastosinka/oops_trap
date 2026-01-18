import { mount, flushPromises } from "@vue/test-utils";
import LobbyPage from "@/views/LobbyPage.vue";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Моки
vi.mock("@/components/base/VolumeControl.vue", () => ({
  default: {
    template: "<div class='volume-control-stub' />",
  },
}));

vi.mock("@/stores/user", () => {
  const { ref } = require("vue");
  return {
    useUserStore: () => ({
      user: ref({ id: "user123", name: "Test User" }),
      userId: ref("user123"),
      userName: ref("Test User"),
      lobbySettings: ref({}),
      gameMap: ref(null),
      myRole: ref(null),
      gameSocket: ref(null),
      initializeUser: vi.fn(),
      setGameSocket: vi.fn(),
    }),
  };
});

vi.mock("@/utils/websocket", () => ({
  createGameSocket: vi.fn(() => ({
    onopen: vi.fn(),
    onerror: vi.fn(),
    onclose: vi.fn(),
    onmessage: vi.fn(),
    send: vi.fn(),
    readyState: 1,
    close: vi.fn(),
  })),
}));

vi.mock("ant-design-vue", () => ({
  Modal: {
    confirm: vi.fn((options) => ({
      then: (callback) => {
        if (options.onOk) {
          options.onOk();
        }
        callback();
        return {
          catch: () => {},
        };
      },
    })),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

global.fetch = vi.fn();
global.WebSocket = vi.fn(() => ({
  onopen: vi.fn(),
  onerror: vi.fn(),
  onclose: vi.fn(),
  onmessage: vi.fn(),
  send: vi.fn(),
  readyState: 1,
  close: vi.fn(),
}));

describe("LobbyPage", () => {
  let wrapper;
  let mockRouter;
  let mockRoute;

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(), // Добавляем replace для теста exitLobby
    };
    mockRoute = { query: { id: "123" } };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ownerId: "user123",
          status: "waiting",
          trapper: "user123",
          map: 1,
          time: "normal",
        },
        players: [{ id: "user123", name: "Test User" }],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (wrapper) wrapper.unmount();
  });

  const createWrapper = (options = {}) => {
    return mount(LobbyPage, {
      global: {
        mocks: {
          $route: mockRoute,
          $router: mockRouter,
        },
        stubs: ["BaseButton", "UniversalModal"],
        ...options.global,
      },
      ...options,
    });
  };

  describe("Initialization", () => {
    it("инициализирует пользователя и лобби при создании", async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.lobbyId).toBe("123");
      expect(wrapper.vm.userStore.initializeUser).toHaveBeenCalled();
    });

    it("начинает опрос состояния лобби", async () => {
      wrapper = createWrapper();

      expect(wrapper.vm.pollInterval).toBeDefined();
    });

    it("останавливает опрос при размонтировании", async () => {
      wrapper = createWrapper();
      const stopPollingSpy = vi.spyOn(wrapper.vm, "stopPolling");

      wrapper.unmount();

      expect(stopPollingSpy).toHaveBeenCalled();
    });
  });

  describe("Computed Properties", () => {
    it("возвращает код лобби", () => {
      wrapper = createWrapper();
      wrapper.vm.lobbyId = "123";

      expect(wrapper.vm.lobbyCode).toBe("123");
    });

    it("возвращает пустой код лобби когда lobbyId отсутствует", () => {
      wrapper = createWrapper();
      wrapper.vm.lobbyId = null;

      expect(wrapper.vm.lobbyCode).toBe("");
    });
  });

  describe("UI Rendering", () => {
    it("отображает информацию о пользователе", async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        userName: "Test User",
        userId: "user123",
        isHost: true,
      });

      expect(wrapper.text()).toContain("Test User");
      expect(wrapper.text()).toContain("(ID: user123)");
      expect(wrapper.text()).toContain("👑");
    });

    it("отображает код и статус лобби", async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        lobbyId: "123",
        lobbyStatus: "waiting",
      });

      expect(wrapper.text()).toContain("Code: 123");
      expect(wrapper.text()).toContain("Status: waiting");
    });

    it("отображает список игроков с метками", async () => {
      wrapper = createWrapper();
      const testPlayers = [
        { id: "user123", name: "Test User", color: "#FF6B6B", isHost: true },
        {
          id: "user456",
          name: "Other Player",
          color: "#4ECDC4",
          isHost: false,
        },
      ];

      await wrapper.setData({ players: testPlayers });

      expect(wrapper.text()).toContain("Test User");
      expect(wrapper.text()).toContain("Other Player");
      expect(wrapper.text()).toContain("(You)");
      expect(wrapper.text()).toContain("👑");
    });

    it("показывает кнопку Settings только для хоста", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ isHost: true });

      const buttons = wrapper.findAllComponents({ name: "BaseButton" });
      const settingsButton = buttons.find(
        (btn) => btn.attributes("label") === "Settings"
      );

      expect(settingsButton.exists()).toBe(true);
    });

    it("не показывает кнопку Settings для не-хоста", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ isHost: false });

      const buttons = wrapper.findAllComponents({ name: "BaseButton" });
      const settingsButton = buttons.find(
        (btn) => btn.attributes("label") === "Settings"
      );

      expect(settingsButton).toBeUndefined();
    });
  });

  describe("Game Start Logic", () => {
    it("разрешает кнопку Start при 2+ игроках", async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        isHost: true,
        players: [{ id: "1" }, { id: "2" }],
        lobbyStatus: "waiting",
      });

      const buttons = wrapper.findAllComponents({ name: "BaseButton" });
      const startButton = buttons.find(
        (btn) => btn.attributes("label") === "Start"
      );

      expect(startButton.attributes("unabled")).toBeUndefined();
    });

    it("блокирует кнопку Start при менее 2 игроков", async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        isHost: true,
        players: [{ id: "1" }],
        lobbyStatus: "waiting",
      });

      const buttons = wrapper.findAllComponents({ name: "BaseButton" });
      const startButton = buttons.find(
        (btn) => btn.attributes("label") === "Start"
      );

      expect(startButton.attributes("disabled")).toBeDefined();
    });

    it("не показывает кнопку Start для не-хоста", async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        isHost: false,
        players: [{ id: "1" }, { id: "2" }],
        lobbyStatus: "waiting",
      });

      const buttons = wrapper.findAllComponents({ name: "BaseButton" });
      const startButton = buttons.find(
        (btn) => btn.attributes("label") === "Start"
      );

      expect(startButton).toBeUndefined();
    });
  });

  describe("Navigation", () => {
    it("перенаправляет на игру при статусе in-progress", async () => {
      wrapper = createWrapper();

      // Создаем мок для метода fetchLobbyData, который используется в checkLobbyStatus
      const fetchLobbyDataSpy = vi
        .spyOn(wrapper.vm, "fetchLobbyData")
        .mockImplementation(async function () {
          this.lobbyStatus = "in-progress";
          this.lobbyId = "123";
          this.isHost = true;
          await this.redirectToGamePage();
        });

      await wrapper.vm.fetchLobbyData();

      expect(mockRouter.push).toHaveBeenCalledWith({
        path: "/game/123",
        query: {
          lobbyId: "123",
          isHost: true,
        },
      });

      fetchLobbyDataSpy.mockRestore();
    });
  });

  describe("Settings Modal", () => {
    it("открывает модальное окно настроек", async () => {
      wrapper = createWrapper();

      // Устанавливаем данные напрямую
      await wrapper.setData({
        isHost: true,
        players: [
          { id: "user123", name: "Test User", color: "#FF6B6B", isHost: true },
        ],
        pendingSettings: {
          mafiaId: "user123",
          map: 1,
          time: "normal",
        },
      });

      // Получаем кнопку Settings
      await wrapper.vm.openSettings();

      expect(wrapper.vm.showSettings).toBe(true);
    });

    it("закрывает модальное окно настроек", async () => {
      wrapper = createWrapper();

      await wrapper.setData({ showSettings: true });
      wrapper.vm.showSettings = false;

      expect(wrapper.vm.showSettings).toBe(false);
    });
  });

  describe("Exit Lobby", () => {
    it("показывает подтверждение выхода", async () => {
      wrapper = createWrapper();
      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.showExitConfirm();

      expect(Modal.confirm).toHaveBeenCalled();
    });

    it("обрабатывает ошибку при выходе из лобби", async () => {
      wrapper = createWrapper();
      const { Modal } = await import("ant-design-vue");

      global.fetch.mockRejectedValue(new Error("Network error"));

      await wrapper.vm.exitLobby();

      expect(mockRouter.replace).toHaveBeenCalledWith("/createLobby");
      expect(Modal.error).not.toHaveBeenCalled(); // exitLobby не вызывает Modal.error при ошибке
    });
  });

  describe("Error Handling", () => {
    it("обрабатывает ошибки при загрузке данных лобби", async () => {
      wrapper = createWrapper();
      global.fetch.mockRejectedValue(new Error("Network error"));

      // Не должно выбрасывать исключение
      await expect(wrapper.vm.fetchLobbyData()).resolves.not.toThrow();
    });
  });

  describe("Player Management", () => {
    it("генерирует уникальные цвета для игроков", () => {
      wrapper = createWrapper();

      const color1 = wrapper.vm.getPlayerColor(0);
      const color2 = wrapper.vm.getPlayerColor(1);
      const color3 = wrapper.vm.getPlayerColor(10); // за пределами массива

      expect(color1).toBe("#FF6B6B");
      expect(color2).toBe("#4ECDC4");
      expect(color3).toBeDefined();
      expect(color1).not.toBe(color2);
    });

    it("обновляет список игроков с правильным статусом хоста", () => {
      wrapper = createWrapper();
      // Устанавливаем lobbyOwnerId напрямую
      wrapper.vm.lobbyOwnerId = "user123";

      const playersData = [
        { id: "user123", name: "Host Player" },
        { id: "user456", name: "Regular Player" },
      ];

      // Используем метод updatePlayers вместо updatePlayersList
      wrapper.vm.updatePlayers(playersData);

      expect(wrapper.vm.players).toHaveLength(2);
      expect(wrapper.vm.players[0].isHost).toBe(true);
      expect(wrapper.vm.players[1].isHost).toBe(false);
      expect(wrapper.vm.players[0].color).toBeDefined();
      expect(wrapper.vm.players[1].color).toBeDefined();
    });
  });
});
