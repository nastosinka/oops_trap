import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateLobbyPage from '@/views/CreateLobbyPage.vue'

vi.mock('@/components/base/BaseButton.vue', () => ({
  default: {
    template: '<button><slot></slot></button>',
    props: ['label', 'size']
  }
}))

vi.mock('@/components/base/UniversalModal.vue', () => ({
  default: {
    template: '<div><slot></slot></div>',
    props: ['title', 'type', 'fields', 'submitText', 'statsData'],
    emits: ['close', 'submit']
  }
}))

vi.mock('ant-design-vue', () => ({
  Modal: {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn()
  }
}))

vi.mock('@/utils/api-auth.js', () => ({
  apiFetch: vi.fn()
}))

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

global.localStorage = localStorageMock

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('[]')
  })
)

describe('CreateLobbyPage', () => {
  let wrapper
  let mockRouter

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouter = {
      push: vi.fn()
    }

    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        name: 'TestUser'
      })
    )

    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('[]')
      })
    )

    wrapper = mount(CreateLobbyPage, {
      global: {
        mocks: {
          $router: mockRouter
        }
      }
    })
  })

  describe('Базовый рендеринг', () => {
    it('отображает страницу создания лобби', () => {
      expect(wrapper.find('.create-lobby-page').exists()).toBe(true)
    })

    it('показывает никнейм пользователя из localStorage', () => {
      expect(wrapper.find('.nickname-label').text()).toBe('TestUser')
    })

    it('показывает "Guest" если пользователь не найден', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const localWrapper = mount(CreateLobbyPage, {
        global: {
          mocks: {
            $router: mockRouter
          }
        }
      })

      expect(localWrapper.find('.nickname-label').text()).toBe('Guest')
    })
  })

  describe('Управление состоянием модальных окон', () => {
    it('открывает модалку статистики при клике на трофей', async () => {
      expect(wrapper.vm.showStatsModal).toBe(false)
      await wrapper.find('.trophy-icon').trigger('click')
      expect(wrapper.vm.showStatsModal).toBe(true)
    })

    it('открывает модалку правил', async () => {
      await wrapper.setData({ showRulesModal: true })
      expect(wrapper.vm.showRulesModal).toBe(true)
    })

    it('открывает модалку присоединения к лобби', async () => {
      await wrapper.setData({ showJoinLobby: true })
      expect(wrapper.vm.showJoinLobby).toBe(true)
    })
  })

  describe('Создание лобби', () => {
    it('успешно создает лобби и перенаправляет', async () => {
      const { apiFetch } = await import('@/utils/api-auth.js')
      apiFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 123 }))
      })

      await wrapper.vm.createLobby()

      expect(apiFetch).toHaveBeenCalledWith('/api/lobby/newlobby', {
        method: 'POST',
        body: JSON.stringify({ ownerId: 1 })
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/lobby?id=123&mode=create')
    })

    it('обрабатывает ошибку при создании лобби', async () => {
      const { apiFetch } = await import('@/utils/api-auth.js')
      const { Modal } = await import('ant-design-vue')

      apiFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Error message')
      })

      await wrapper.vm.createLobby()

      expect(Modal.error).toHaveBeenCalled()
    })
  })

  describe('Выход из игры', () => {
    it('показывает подтверждение выхода', async () => {
      const { Modal } = await import('ant-design-vue')

      await wrapper.vm.showExitConfirm()

      expect(Modal.confirm).toHaveBeenCalled()
    })

    it('выходит из игры и очищает localStorage', async () => {
      const { Modal } = await import('ant-design-vue')

      await wrapper.vm.exitGame()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(Modal.success).toHaveBeenCalled()
    })
  })

  describe('Присоединение к лобби', () => {
    it('успешно присоединяется к лобби', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({}))
      })

      await wrapper.vm.joinLobby({ lobbyCode: '123' })

      expect(global.fetch).toHaveBeenCalledWith('/api/lobby/lobbies/123/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 2
        })
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/lobby?id=123&mode=join')
    })

    it('обрабатывает невалидный код лобби', async () => {
      const { Modal } = await import('ant-design-vue')

      await wrapper.vm.joinLobby({ lobbyCode: 'invalid' })

      expect(Modal.error).toHaveBeenCalled()
    })

    it('обрабатывает ошибку при присоединении', async () => {
      const { Modal } = await import('ant-design-vue')

      global.fetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Error')
      })

      await wrapper.vm.joinLobby({ lobbyCode: '123' })

      expect(Modal.error).toHaveBeenCalled()
    })
  })

  describe('Дополнительные тесты', () => {
    it('инициализируется с правильными начальными значениями', () => {
      expect(wrapper.vm.showRulesModal).toBe(false)
      expect(wrapper.vm.showJoinLobby).toBe(false)
      expect(wrapper.vm.showStatsModal).toBe(false)
      expect(wrapper.vm.isLoadingStats).toBe(false)
    })

    it('имеет computed user из localStorage', () => {
      expect(wrapper.vm.user).toEqual({ name: 'TestUser' })
    })

    it('обрабатывает JSON parse ошибку в createLobby', async () => {
      const { apiFetch } = await import('@/utils/api-auth.js')
      const { Modal } = await import('ant-design-vue')

      apiFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('invalid json')
      })

      await wrapper.vm.createLobby()

      expect(Modal.error).toHaveBeenCalled()
    })
  })
})
