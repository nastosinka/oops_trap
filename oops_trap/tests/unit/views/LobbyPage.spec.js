import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Modal } from "ant-design-vue";
import LobbyPage from "@/views/LobbyPage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";

vi.mock("ant-design-vue", () => ({
  Modal: {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn(),
  },
}));

global.fetch = vi.fn();

const mockRoute = {
  query: {},
};

const mockRouter = {
  push: vi.fn(),
};

describe("LobbyPage", () => {
  let wrapper;

  const createComponent = (options = {}) => {
    return mount(LobbyPage, {
      global: {
        mocks: {
          $route: mockRoute,
          $router: mockRouter,
        },
        stubs: {
          BaseButton: true,
          UniversalModal: true,
        },
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query = {};
  });

  describe("Рендеринг", () => {
    it("отображает никнейм", () => {
      wrapper = createComponent();
      expect(wrapper.find(".nickname").text()).toBe("Nickname");
    });

    it("отображает код лобби когда lobbyId установлен", () => {
      mockRoute.query.id = "123";
      wrapper = createComponent();
      expect(wrapper.find(".lobby-code").text()).toContain("123");
    });

    it("отображает список игроков", () => {
      wrapper = createComponent();
      const players = wrapper.findAll(".player");
      expect(players).toHaveLength(10);
      expect(players[0].find(".player-name").text()).toBe("Player 1");
    });

    it("отображает кнопки для хоста", () => {
      mockRoute.query.mode = "create";
      wrapper = createComponent();

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.attributes("label"));

      expect(buttonLabels).toContain("Settings");
      expect(buttonLabels).toContain("Start");
      expect(buttonLabels).toContain("Exit");
    });

    it("не отображает кнопки Settings и Start для не-хоста", () => {
      mockRoute.query.mode = "join";
      wrapper = createComponent();

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.attributes("label"));

      expect(buttonLabels).not.toContain("Settings");
      expect(buttonLabels).not.toContain("Start");
      expect(buttonLabels).toContain("Exit");
    });
  });

  describe("Вычисляемые свойства", () => {
    it("возвращает пустую строку для lobbyCode когда lobbyId не установлен", () => {
      wrapper = createComponent();
      expect(wrapper.vm.lobbyCode).toBe("");
    });

    it("возвращает строковое представление lobbyId для lobbyCode", () => {
      mockRoute.query.id = "456";
      wrapper = createComponent();
      expect(wrapper.vm.lobbyCode).toBe("456");
    });
  });

  describe("Методы", () => {
    describe("handleSettingsApply", () => {
      beforeEach(() => {
        mockRoute.query.id = "123";
        wrapper = createComponent();
        global.fetch.mockResolvedValue({
          ok: true,
          json: vi.fn(),
        });
      });

      it("отправляет настройки на сервер при успешном ответе", async () => {
        const settings = { map: "forest", mafia: 2, time: "fast" };

        await wrapper.vm.handleSettingsApply(settings);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/lobby/lobbies/123/settings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ownerId: 1,
              map: "forest",
              time: "fast",
              trapper: 2,
            }),
          }
        );

        expect(Modal.success).toHaveBeenCalledWith({
          title: "Success",
          content: "Settings updated",
          okText: "OK",
        });

        expect(wrapper.vm.currentSettings).toEqual({
          map: "forest",
          mafia: 2,
          time: "fast",
        });
      });

      it("показывает ошибку при неудачном запросе", async () => {
        global.fetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        const settings = { map: "forest" };

        await wrapper.vm.handleSettingsApply(settings);

        expect(Modal.error).toHaveBeenCalledWith({
          title: "Error",
          content: "Failed to update settings",
          okText: "OK",
        });
      });
    });

    describe("showExitConfirm", () => {
      it("показывает модальное окно подтверждения выхода", () => {
        wrapper = createComponent();

        wrapper.vm.showExitConfirm();

        expect(Modal.confirm).toHaveBeenCalledWith({
          title: "Exit Game",
          content: "Are you sure you want to exit the game?",
          okText: "Yes, Exit",
          cancelText: "Cancel",
          okType: "danger",
          centered: true,
          onOk: expect.any(Function),
        });
      });
    });

    describe("exitLobby", () => {
      beforeEach(() => {
        mockRoute.query.id = "123";
        global.fetch.mockResolvedValue({
          ok: true,
          json: vi.fn(),
        });
      });

      it("удаляет лобби когда пользователь является хостом", async () => {
        mockRoute.query.mode = "create";
        wrapper = createComponent();

        await wrapper.vm.exitLobby();

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/lobby/lobbies/123/delete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ownerId: 1,
            }),
          }
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");
      });

      it("покидает лобби когда пользователь не является хостом", async () => {
        mockRoute.query.mode = "join";
        wrapper = createComponent();

        await wrapper.vm.exitLobby();

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/lobby/lobbies/123/leave",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: 2,
            }),
          }
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");
      });

      it("показывает ошибку при неудачном удалении лобби", async () => {
        mockRoute.query.mode = "create";
        wrapper = createComponent();
        global.fetch.mockResolvedValue({
          ok: false,
          status: 404,
        });

        await wrapper.vm.exitLobby();

        expect(Modal.error).toHaveBeenCalledWith({
          title: "Error",
          content: "Failed to delete lobby: 404",
          okText: "OK",
        });
        expect(mockRouter.push).not.toHaveBeenCalled();
      });

      it("показывает ошибку при неудачном выходе из лобби", async () => {
        mockRoute.query.mode = "join";
        wrapper = createComponent();
        global.fetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        await wrapper.vm.exitLobby();

        expect(Modal.error).toHaveBeenCalledWith({
          title: "Error",
          content: "Failed to leave lobby: 500",
          okText: "OK",
        });
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    describe("handleStart", () => {
      it("определен но не реализован", () => {
        wrapper = createComponent();
        expect(typeof wrapper.vm.handleStart).toBe("function");

        expect(() => wrapper.vm.handleStart()).not.toThrow();
      });
    });
  });

  describe("Взаимодействие с модальным окном", () => {
    it("скрывает модальное окно настроек при событии close", async () => {
      mockRoute.query.mode = "create";
      wrapper = createComponent();
      wrapper.vm.showSettings = true;
      await flushPromises();

      const modal = wrapper.findComponent(UniversalModal);
      modal.vm.$emit("close");

      expect(wrapper.vm.showSettings).toBe(false);
    });
  });
});
