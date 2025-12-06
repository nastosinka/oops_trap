// // vitest.setup.js
// import { vi } from 'vitest'

// // Устанавливаем глобальные переменные для счастливого DOM
// global.TextEncoder = TextEncoder
// global.TextDecoder = TextDecoder
// global.Uint8Array = Uint8Array

// // Полный мок для Sentry
// vi.mock('@sentry/vue', () => ({
//   init: vi.fn(),
//   browserTracingIntegration: vi.fn(() => ({})),
//   captureMessage: vi.fn(),
//   captureException: vi.fn(),
//   setUser: vi.fn(),
//   setTag: vi.fn(),
//   setContext: vi.fn(),
//   withScope: vi.fn(),
//   startTransaction: vi.fn(),
//   getCurrentHub: vi.fn(() => ({
//     getScope: vi.fn(() => ({
//       setTag: vi.fn(),
//       setUser: vi.fn()
//     }))
//   }))
// }))

// // Полный мок для Vue Router
// vi.mock('vue-router', async (importOriginal) => {
//   const actual = await importOriginal()
//   return {
//     ...actual,
//     createWebHashHistory: vi.fn(() => ({
//       base: '/',
//       location: { pathname: '/' },
//       push: vi.fn(),
//       replace: vi.fn(),
//       go: vi.fn(),
//       back: vi.fn(),
//       forward: vi.fn(),
//       createHref: vi.fn()
//     })),
//     createWebHistory: vi.fn(() => ({
//       base: '/',
//       location: { pathname: '/' },
//       push: vi.fn(),
//       replace: vi.fn(),
//       go: vi.fn(),
//       back: vi.fn(),
//       forward: vi.fn(),
//       createHref: vi.fn()
//     })),
//     createMemoryHistory: vi.fn(),
//     RouterView: 'RouterView',
//     RouterLink: 'RouterLink'
//   }
// })

// // Мокаем ant-design-vue с правильными спаями
// const mockModal = {
//   success: vi.fn(),
//   error: vi.fn(),
//   confirm: vi.fn()
// }

// vi.mock('ant-design-vue', () => ({
//   Modal: mockModal
// }))

// // Мокаем API
// global.fetch = vi.fn()

// // Мокаем VK Bridge
// vi.mock('@vkontakte/vk-bridge', () => ({
//   default: {
//     send: vi.fn(),
//     subscribe: vi.fn(),
//     unsubscribe: vi.fn(),
//     supports: vi.fn()
//   }
// }))

// // Мокаем утилиты
// vi.mock('@/utils/api-auth.js', () => ({
//   apiFetch: vi.fn()
// }))

// vi.mock('@/utils/notification-wrapper', () => ({
//   showSuccess: vi.fn()
// }))

// // Экспортируем моки для использования в тестах
// export { mockModal }

// // Добавьте в конец файла vitest.setup.js

// // Мокаем localStorage
// const localStorageMock = {
//   getItem: vi.fn(),
//   setItem: vi.fn(),
//   removeItem: vi.fn(),
//   clear: vi.fn(),
//   length: 0,
//   key: vi.fn(),
// };

// global.localStorage = localStorageMock;

import { vi } from "vitest";

// jsdom автоматически предоставляет DOM API, поэтому эти строки не нужны
// global.TextEncoder = TextEncoder
// global.TextDecoder = TextDecoder
// global.Uint8Array = Uint8Array

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.localStorage = localStorageMock;

// Полный мок для Sentry
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

// Упрощенный мок для Vue Router
vi.mock("vue-router", () => ({
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  createWebHashHistory: vi.fn(),
}));

// Мокаем ant-design-vue
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

// Мокаем API
global.fetch = vi.fn();

// Мокаем VK Bridge
vi.mock("@vkontakte/vk-bridge", () => ({
  default: {
    send: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    supports: vi.fn(),
  },
}));

// Мокаем утилиты
vi.mock("@/utils/api-auth.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/utils/notification-wrapper", () => ({
  showSuccess: vi.fn(),
}));

// Экспортируем моки для использования в тестах
export { mockModal, localStorageMock };
