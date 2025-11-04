import { mount } from "@vue/test-utils";
import { Modal } from "ant-design-vue";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LobbyPage from "@/views/LobbyPage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";

vi.mock("ant-design-vue", () => ({
  Modal: {
    confirm: vi.fn(),
    success: vi.fn(),
  },
}));

describe("LobbyPage", () => {
  let wrapper;
  const mockRouter = {
    push: vi.fn(),
  };

  const createWrapper = (routeQuery = {}) => {
    return mount(LobbyPage, {
      global: {
        mocks: {
          $route: {
            query: routeQuery,
          },
          $router: mockRouter,
        },
        components: {
          BaseButton,
          UniversalModal,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("displays nickname and lobby code", () => {
      wrapper = createWrapper();

      expect(wrapper.find(".nickname").text()).toBe("Nickname");
      expect(wrapper.find(".lobby-code").text()).toBe("Code: XYZ789");
    });

    it("displays players list", () => {
      wrapper = createWrapper();

      const players = wrapper.findAll(".player");
      expect(players).toHaveLength(10);
      expect(players[0].find(".player-name").text()).toBe("Player 1");
    });

    it("shows player colors", () => {
      wrapper = createWrapper();

      const firstPlayerColor = wrapper.find(".player-color");
      expect(firstPlayerColor.attributes("style")).toContain(
        "rgb(255, 107, 107)"
      );
    });
  });

  describe("Host Logic", () => {
    it("shows Settings and Start buttons when user is host", () => {
      wrapper = createWrapper({ mode: "create" });

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.props("label"));

      expect(buttonLabels).toContain("Settings");
      expect(buttonLabels).toContain("Start");
    });

    it("hides Settings and Start buttons when user is not host", () => {
      wrapper = createWrapper({ mode: "join" });

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.props("label"));

      expect(buttonLabels).not.toContain("Settings");
      expect(buttonLabels).not.toContain("Start");
      expect(buttonLabels).toContain("Exit");
    });
  });

  describe("Modal Windows", () => {
    it("shows settings modal when Settings button is clicked", async () => {
      wrapper = createWrapper({ mode: "create" });

      const buttons = wrapper.findAllComponents(BaseButton);
      const settingsButton = buttons.find(
        (button) => button.props("label") === "Settings"
      );

      await settingsButton.trigger("click");

      expect(wrapper.vm.showSettings).toBe(true);
    });

    it("shows exit confirmation when Exit button is clicked", async () => {
      wrapper = createWrapper();

      const buttons = wrapper.findAllComponents(BaseButton);
      const exitButton = buttons.find(
        (button) => button.props("label") === "Exit"
      );

      await exitButton.trigger("click");

      expect(Modal.confirm).toHaveBeenCalled();
    });
  });

  describe("Modal Confirmations", () => {
    it("shows exit confirmation modal with correct options", () => {
      wrapper = createWrapper();

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

    it("redirects to createLobby when exit confirmation is confirmed", () => {
      wrapper = createWrapper();

      let savedOnOk;
      Modal.confirm.mockImplementation((options) => {
        savedOnOk = options.onOk;
        return { destroy: vi.fn() };
      });

      wrapper.vm.showExitConfirm();

      expect(Modal.confirm).toHaveBeenCalled();

      if (savedOnOk) {
        savedOnOk();
      }

      expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");
    });
  });

  describe("Settings Modal", () => {
    it("closes settings modal when close event is emitted", async () => {
      wrapper = createWrapper({ mode: "create" });
      wrapper.vm.showSettings = true;
      await wrapper.vm.$nextTick();

      const settingsModal = wrapper.findComponent(UniversalModal);
      expect(settingsModal.exists()).toBe(true);

      settingsModal.vm.$emit("close");

      expect(wrapper.vm.showSettings).toBe(false);
    });

    it("applies settings when settings-apply event is emitted", async () => {
      wrapper = createWrapper({ mode: "create" });

      const testSettings = { map: "cave", time: "medium" };
      wrapper.vm.handleSettingsApply(testSettings);

      expect(wrapper.vm.currentSettings).toEqual(testSettings);
    });
  });

  describe("Component Lifecycle", () => {
    it("sets isHost to true when created with create mode", () => {
      wrapper = createWrapper({ mode: "create" });

      expect(wrapper.vm.isHost).toBe(true);
    });

    it("sets isHost to false when created with join mode", () => {
      wrapper = createWrapper({ mode: "join" });

      expect(wrapper.vm.isHost).toBe(false);
    });
  });
});
