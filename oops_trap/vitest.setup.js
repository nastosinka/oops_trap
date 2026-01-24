import { vi } from "vitest";

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.localStorage = localStorageMock;

vi.mock("@sentry/vue", () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  withScope: vi.fn(),
  startTransaction: vi.fn(),
  getCurrentHub: vi.fn(() => ({
    getScope: vi.fn(() => ({
      setTag: vi.fn(),
      setUser: vi.fn(),
    })),
  })),
}));

vi.mock("vue-router", () => ({
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  createWebHashHistory: vi.fn(),
}));

const mockModal = {
  success: vi.fn(),
  error: vi.fn(),
  confirm: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  destroyAll: vi.fn(),
};

vi.mock("ant-design-vue", () => ({
  Modal: mockModal,
}));

global.fetch = vi.fn();

vi.mock("@vkontakte/vk-bridge", () => ({
  default: {
    send: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    supports: vi.fn(),
  },
}));

vi.mock("@/utils/api-auth.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/utils/notification-wrapper", () => ({
  showSuccess: vi.fn(),
}));

export { mockModal, localStorageMock };
