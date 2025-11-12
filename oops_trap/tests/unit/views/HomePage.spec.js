import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "@/views/HomePage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";

// Моки для уведомлений
vi.mock("@/utils/notification-wrapper", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("HomePage", () => {
  let wrapper;

  const createWrapper = () => {
    return mount(HomePage, {
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
        stubs: {
          "router-view": true, // заглушка для router-view
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Submission", () => {
    it("handles sign up form submission", async () => {
      wrapper = createWrapper();

      expect(() => wrapper.vm.handleSignUp()).not.toThrow();
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/createLobby");
    });

    it("handles sign on form submission", async () => {
      wrapper = createWrapper();

      expect(() => wrapper.vm.handleSignOn()).not.toThrow();
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/createLobby");
    });

    it("emits submit event from sign up modal", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showSignUpModal: true });

      const modal = wrapper.findComponent(UniversalModal);
      modal.vm.$emit("submit", {});

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/createLobby");
    });

    it("emits submit event from sign on modal", async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showSignOnModal: true });

      const modal = wrapper.findComponent(UniversalModal);
      modal.vm.$emit("submit", {});

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith("/createLobby");
    });
  });
});
