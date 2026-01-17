import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HomePage from "@/views/HomePage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/utils/notification-wrapper", () => ({
  showSuccess: vi.fn(),
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({
    login: vi.fn(),
  }),
}));

vi.mock("ant-design-vue", () => ({
  Modal: {
    error: vi.fn(),
  },
}));

describe("HomePage.vue", () => {
  let wrapper;
  let fetchMock;
  let localStorageMock;
  let mockRouter;

  const mountComponent = () => {
    return mount(HomePage, {
      global: {
        plugins: [createPinia()],
        mocks: { $router: mockRouter },
        stubs: {
          BaseButton: true,
          UniversalModal: true,
        },
      },
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockRouter = { push: vi.fn() };

    fetchMock = vi.fn();
    global.fetch = fetchMock;

    localStorageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    wrapper = mountComponent();
  });

  // UI rendering
  describe("UI rendering", () => {
    it("рендерит кнопки", () => {
      const buttons = wrapper.findAllComponents(BaseButton);
      const labels = buttons.map((b) => b.attributes("label"));

      expect(labels).toContain("Sign Up");
      expect(labels).toContain("Sign In");
      expect(labels).toContain("Rules");
    });

    it("модалки скрыты по умолчанию", () => {
      expect(wrapper.findAllComponents(UniversalModal)).toHaveLength(0);
    });
  });

  // Opening modals
  describe("Opening modals", () => {
    it("открывает Sign Up", async () => {
      const btn = wrapper
        .findAllComponents(BaseButton)
        .find((b) => b.attributes("label") === "Sign Up");
      await btn.trigger("click");
      expect(wrapper.vm.showSignUpModal).toBe(true);
    });

    it("открывает Sign In", async () => {
      const btn = wrapper
        .findAllComponents(BaseButton)
        .find((b) => b.attributes("label") === "Sign In");
      await btn.trigger("click");
      expect(wrapper.vm.showSignInModal).toBe(true);
    });

    it("открывает Rules", async () => {
      const btn = wrapper
        .findAllComponents(BaseButton)
        .find((b) => b.attributes("label") === "Rules");
      await btn.trigger("click");
      expect(wrapper.vm.showRulesModal).toBe(true);
    });
  });

  // Closing modals
  describe("Closing modals", () => {
    it("закрывает Sign Up", async () => {
      await wrapper.setData({ showSignUpModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showSignUpModal).toBe(false);
    });

    it("закрывает Sign In", async () => {
      await wrapper.setData({ showSignInModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showSignInModal).toBe(false);
    });

    it("закрывает Rules", async () => {
      await wrapper.setData({ showRulesModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showRulesModal).toBe(false);
    });
  });

  // handleSignIn
  describe("handleSignIn()", () => {
    it("успешный вход", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "test-token",
            user: { id: 99, username: "admin" },
          }),
      });

      await wrapper.vm.handleSignIn({
        name: "admin",
        password: "123456",
      });

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "123456",
        }),
        credentials: "include",
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");
    });

    it("backend возвращает ошибку", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid creds" }),
      });

      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.handleSignIn({
        name: "admin",
        password: "bad",
      });

      expect(Modal.error).toHaveBeenCalled();
    });

    it("json() кидает исключение", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error("JSON broken")),
      });

      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.handleSignIn({
        name: "admin",
        password: "123456",
      });

      expect(Modal.error).toHaveBeenCalled();
    });

    it("сетевой сбой", async () => {
      fetchMock.mockRejectedValue(new Error("Network err"));

      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.handleSignIn({
        name: "admin",
        password: "123456",
      });

      expect(Modal.error).toHaveBeenCalled();
    });
  });

  // handleSignUp
  describe("handleSignUp()", () => {
    it("ошибка — пароль слишком короткий", async () => {
      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.handleSignUp({
        name: "admin",
        password: "123",
        confirmPassword: "123",
      });

      expect(Modal.error).toHaveBeenCalled();
    });

    it("ошибка — пароли не совпадают", async () => {
      const { Modal } = await import("ant-design-vue");

      await wrapper.vm.handleSignUp({
        name: "admin",
        password: "123456",
        confirmPassword: "654321",
      });

      expect(Modal.error).toHaveBeenCalled();
    });

    it("успешная регистрация", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "token123",
            user: { id: 5, username: "admin" },
          }),
      });

      const { showSuccess } = await import("@/utils/notification-wrapper");

      await wrapper.vm.handleSignUp({
        name: "admin",
        password: "123456",
        confirmPassword: "123456",
      });

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "123456",
        }),
        credentials: "include",
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");

      expect(showSuccess).toHaveBeenCalled();
    });
  });
});
