import { mount } from "@vue/test-utils";
import { Modal } from "ant-design-vue";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateLobbyPage from "@/views/CreateLobbyPage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";

vi.mock("ant-design-vue", () => ({
  Modal: {
    confirm: vi.fn(),
    success: vi.fn(),
  },
}));

describe("CreateLobbyPage", () => {
  let wrapper;

  const createWrapper = () => {
    return mount(CreateLobbyPage, {
      global: {
        mocks: {
          $router: {
            push: vi.fn(),
          },
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
    it("renders all main buttons", () => {
      wrapper = createWrapper();

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.props("label"));

      expect(buttonLabels).toEqual([
        "Rules",
        "Create a lobby",
        "Join the lobby",
        "Exit",
      ]);
    });

    it("displays nickname label and trophy icon", () => {
      wrapper = createWrapper();

      expect(wrapper.find(".nickname-label").text()).toBe("Nickname");
      expect(wrapper.find(".trophy-icon").exists()).toBe(true);
    });

    it("shows stats data in component data", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.statsData).toHaveLength(16);
      expect(wrapper.vm.statsData[0]).toEqual({
        map: "Vector",
        role: "trapmaker",
        time: "1:08",
      });
    });
  });

  describe("Modal Windows", () => {
    it("opens rules modal when Rules button is clicked", async () => {
      wrapper = createWrapper();

      const rulesButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.props("label") === "Rules");

      await rulesButton.trigger("click");

      expect(wrapper.vm.showRulesModal).toBe(true);
    });

    it("opens join lobby modal when Join the lobby button is clicked", async () => {
      wrapper = createWrapper();

      const joinButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.props("label") === "Join the lobby");

      await joinButton.trigger("click");

      expect(wrapper.vm.showJoinLobby).toBe(true);
    });

    it("opens stats modal when trophy icon is clicked", async () => {
      wrapper = createWrapper();

      await wrapper.find(".trophy-icon").trigger("click");

      expect(wrapper.vm.showStatsModal).toBe(true);
    });

    it("closes modals when close event is emitted", async () => {
      wrapper = createWrapper();

      await wrapper.setData({ showRulesModal: true });
      const rulesModal = wrapper.findComponent(UniversalModal);
      rulesModal.vm.$emit("close");
      expect(wrapper.vm.showRulesModal).toBe(false);

      await wrapper.setData({ showJoinLobby: true });
      const joinModal = wrapper.findComponent(UniversalModal);
      joinModal.vm.$emit("close");
      expect(wrapper.vm.showJoinLobby).toBe(false);

      await wrapper.setData({ showStatsModal: true });
      const statsModal = wrapper.findComponent(UniversalModal);
      statsModal.vm.$emit("close");
      expect(wrapper.vm.showStatsModal).toBe(false);
    });
  });

  describe("Navigation Methods", () => {
    it("navigates to lobby with create mode when createLobby is called", () => {
      wrapper = createWrapper();

      wrapper.vm.createLobby();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith(
        "/lobby?mode=create"
      );
    });

    it("navigates to lobby without mode when joinLobby is called", () => {
      wrapper = createWrapper();

      wrapper.vm.joinLobby();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/lobby");
    });

    it("handles join lobby form submission", async () => {
      wrapper = createWrapper();

      await wrapper.setData({ showJoinLobby: true });

      const joinModal = wrapper.findComponent(UniversalModal);
      joinModal.vm.$emit("submit", { lobbyCode: "ABC123" });

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/lobby");
    });
  });

  describe("Exit Confirmation", () => {
    it("shows exit confirmation when Exit button is clicked", async () => {
      wrapper = createWrapper();

      const exitButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.props("label") === "Exit");

      await exitButton.trigger("click");

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

    it("calls exitGame when exit confirmation is confirmed", () => {
      wrapper = createWrapper();

      wrapper.vm.showExitConfirm();
      const onOkCallback = Modal.confirm.mock.calls[0][0].onOk;
      onOkCallback();

      expect(Modal.success).toHaveBeenCalled();
    });

    it("shows success modal and navigates to home when exitGame is called", () => {
      wrapper = createWrapper();

      wrapper.vm.exitGame();

      expect(Modal.success).toHaveBeenCalledWith({
        title: "Game Exited",
        content: "Thank you for playing!",
        okText: "OK",
        onOk: expect.any(Function),
      });
    });
  });

  describe("Modal Props", () => {
    it("passes correct props to stats modal", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showStatsModal: true });

      const statsModal = wrapper
        .findAllComponents(UniversalModal)
        .find((modal) => modal.props("type") === "stats");

      expect(statsModal.props()).toMatchObject({
        title: "",
        type: "stats",
        statsData: wrapper.vm.statsData,
      });
    });

    it("passes correct props to join lobby modal", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showJoinLobby: true });

      const joinModal = wrapper
        .findAllComponents(UniversalModal)
        .find((modal) => modal.props("fields")?.includes("lobbyCode"));

      expect(joinModal.props()).toMatchObject({
        title: "",
        fields: ["lobbyCode"],
        submitText: "Join",
      });
    });

    it("passes correct props to rules modal", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showRulesModal: true });

      const rulesModal = wrapper
        .findAllComponents(UniversalModal)
        .find((modal) => modal.props("type") === "rules");

      expect(rulesModal.props()).toMatchObject({
        title: "",
        type: "rules",
      });
    });
  });
});
