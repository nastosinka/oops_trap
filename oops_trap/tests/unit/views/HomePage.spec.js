import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HomePage from "@/views/HomePage.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";

vi.mock("@/utils/notification-wrapper", () => {
  return {
    showSuccess: vi.fn(),
  };
});

describe("HomePage", () => {
  let wrapper;
  let showSuccessMock;
  let fetchMock;
  let localStorageMock;
  let mockRouter;
  let mockToast;

  const createComponent = (options = {}) => {
    return mount(HomePage, {
      global: {
        mocks: {
          $router: mockRouter,
          $toast: mockToast,
        },
        stubs: {
          BaseButton: true,
          UniversalModal: true,
        },
      },
      ...options,
    });
  };

  beforeEach(async () => {
    showSuccessMock = vi.mocked(
      (await import("@/utils/notification-wrapper")).showSuccess
    );

    fetchMock = vi.fn();
    global.fetch = fetchMock;

    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    mockRouter = {
      push: vi.fn(),
    };

    mockToast = {
      error: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe("Рендеринг", () => {
    it("отображает все кнопки", () => {
      wrapper = createComponent();

      const buttons = wrapper.findAllComponents(BaseButton);
      const buttonLabels = buttons.map((button) => button.attributes("label"));

      expect(buttonLabels).toContain("Sign Up");
      expect(buttonLabels).toContain("Sign On");
      expect(buttonLabels).toContain("Rules");
    });

    it("изначально не показывает модальные окна", () => {
      wrapper = createComponent();

      const modals = wrapper.findAllComponents(UniversalModal);
      expect(modals).toHaveLength(0);
    });
  });

  describe("Открытие модальных окон", () => {
    it("показывает модальное окно Sign Up при клике на кнопку", async () => {
      wrapper = createComponent();

      const signUpButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.attributes("label") === "Sign Up");
      await signUpButton.trigger("click");

      expect(wrapper.vm.showSignUpModal).toBe(true);
    });

    it("показывает модальное окно Sign On при клике на кнопку", async () => {
      wrapper = createComponent();

      const signOnButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.attributes("label") === "Sign On");
      await signOnButton.trigger("click");

      expect(wrapper.vm.showSignOnModal).toBe(true);
    });

    it("показывает модальное окно Rules при клике на кнопку", async () => {
      wrapper = createComponent();

      const rulesButton = wrapper
        .findAllComponents(BaseButton)
        .find((button) => button.attributes("label") === "Rules");
      await rulesButton.trigger("click");

      expect(wrapper.vm.showRulesModal).toBe(true);
    });
  });

  describe("Закрытие модальных окон", () => {
    it("закрывает модальное окно Sign Up при событии close", async () => {
      wrapper = createComponent();
      await wrapper.setData({ showSignUpModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showSignUpModal).toBe(false);
    });

    it("закрывает модальное окно Sign On при событии close", async () => {
      wrapper = createComponent();
      await wrapper.setData({ showSignOnModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showSignOnModal).toBe(false);
    });

    it("закрывает модальное окно Rules при событии close", async () => {
      wrapper = createComponent();
      await wrapper.setData({ showRulesModal: true });
      await flushPromises();

      const modal = wrapper.findAllComponents(UniversalModal)[0];
      modal.vm.$emit("close");

      expect(wrapper.vm.showRulesModal).toBe(false);
    });
  });

  describe("Методы", () => {
    describe("handleSignOn", () => {
      beforeEach(() => {
        fetchMock.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              token: "test-token",
              user: { id: 1, username: "testuser" },
            }),
        });
      });

      it("успешно выполняет вход и перенаправляет", async () => {
        wrapper = createComponent();
        await wrapper.setData({ showSignOnModal: true });

        const values = { name: "testuser", password: "password123" };
        await wrapper.vm.handleSignOn(values);

        expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "password123",
          }),
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "token",
          "test-token"
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({ id: 1, username: "testuser" })
        );

        expect(wrapper.vm.showSignOnModal).toBe(false);
        expect(showSuccessMock).toHaveBeenCalledWith("Login successful!");
        expect(mockRouter.push).toHaveBeenCalledWith("/createLobby");
      });

      it("обрабатывает ошибку при неудачном входе", async () => {
        fetchMock.mockResolvedValue({
          ok: false,
          json: () =>
            Promise.resolve({
              error: "Invalid credentials",
            }),
        });

        wrapper = createComponent();
        await wrapper.setData({ showSignOnModal: true });

        const values = { name: "testuser", password: "wrongpassword" };
        await wrapper.vm.handleSignOn(values);

        expect(mockToast.error).toHaveBeenCalledWith("Invalid credentials");
        expect(wrapper.vm.showSignOnModal).toBe(true);
      });

      it("обрабатывает сетевые ошибки", async () => {
        fetchMock.mockRejectedValue(new Error("Network error"));

        wrapper = createComponent();
        await wrapper.setData({ showSignOnModal: true });

        const values = { name: "testuser", password: "password123" };
        await wrapper.vm.handleSignOn(values);

        expect(mockToast.error).toHaveBeenCalledWith("Network error");
        expect(wrapper.vm.showSignOnModal).toBe(true);
      });

      it("обрабатывает ошибку когда response.json() выбрасывает исключение", async () => {
        fetchMock.mockResolvedValue({
          ok: false,
          json: () => Promise.reject(new Error("JSON parse error")),
        });

        wrapper = createComponent();
        await wrapper.setData({ showSignOnModal: true });

        const values = { name: "testuser", password: "password123" };
        await wrapper.vm.handleSignOn(values);

        expect(mockToast.error).toHaveBeenCalledWith("JSON parse error");
      });
    });
  });

  describe("Локальное хранилище", () => {
    it("сохраняет токен и пользователя в localStorage при успешном входе", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "auth-token-123",
            user: mockUser,
          }),
      });

      wrapper = createComponent();
      const values = { name: "testuser", password: "password123" };
      await wrapper.vm.handleSignOn(values);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "auth-token-123"
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser)
      );
    });
  });
});
