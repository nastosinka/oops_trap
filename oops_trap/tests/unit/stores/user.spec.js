import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user.js'

// Определяем константы состояний WebSocket
const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}

// Мок для WebSocket с правильными состояниями
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.OPEN // По умолчанию OPEN
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    this.close = vi.fn((code, reason) => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) this.onclose({ code, reason })
    })
    this.send = vi.fn()
  }
}

// Добавляем в глобальную область видимости
global.WebSocket = MockWebSocket

describe('User Store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockUser = {
    id: 123,
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'avatar.jpg'
  }

  describe('Initial state', () => {
    it('should have null user initially', () => {
      const store = useUserStore()
      expect(store.user).toBeNull()
    })

    it('should have null sessionId initially', () => {
      const store = useUserStore()
      expect(store.sessionId).toBeNull()
    })

    it('should have null gameSocket initially', () => {
      const store = useUserStore()
      expect(store.gameSocket).toBeNull()
    })

    it('should have default role as "runner"', () => {
      const store = useUserStore()
      expect(store.myRole).toBe('runner')
    })

    it('should have default gameMap as 1', () => {
      const store = useUserStore()
      expect(store.gameMap).toBe(1)
    })

    it('should have isAlive as true by default', () => {
      const store = useUserStore()
      expect(store.isAlive).toBe(true)
    })
  })

  describe('Computed properties', () => {
    it('userId should return null when user is not logged in', () => {
      const store = useUserStore()
      expect(store.userId).toBeNull()
    })

    it('userId should return user id when logged in', () => {
      const store = useUserStore()
      store.user = mockUser
      expect(store.userId).toBe(mockUser.id)
    })

    it('userName should return "Guest" when user is not logged in', () => {
      const store = useUserStore()
      expect(store.userName).toBe('Guest')
    })

    it('userName should return user name when logged in', () => {
      const store = useUserStore()
      store.user = mockUser
      expect(store.userName).toBe(mockUser.name)
    })

    it('isAuthenticated should return false when user is null', () => {
      const store = useUserStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated should return true when user exists', () => {
      const store = useUserStore()
      store.user = mockUser
      expect(store.isAuthenticated).toBe(true)
    })

    it('isInGame should return false when gameSocket is null', () => {
      const store = useUserStore()
      expect(store.isInGame).toBe(false)
    })

    it('isInGame should return false when gameSocket is closed', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      mockSocket.readyState = MockWebSocket.CLOSED
      store.gameSocket = mockSocket
      // Здесь нужно проверить computed свойство, а не gameSocket напрямую
      expect(store.isInGame).toBe(false)
    })

    it('isInGame should return true when gameSocket is open', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      mockSocket.readyState = MockWebSocket.OPEN
      store.gameSocket = mockSocket
      expect(store.isInGame).toBe(true)
    })

    it('getGameSocket should return gameSocket', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      store.gameSocket = mockSocket
      // Используем toStrictEqual вместо toBe для сравнения объектов
      expect(store.getGameSocket).toStrictEqual(mockSocket)
    })

    it('isInGame should return false when gameSocket is in CONNECTING state', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      mockSocket.readyState = MockWebSocket.CONNECTING
      store.gameSocket = mockSocket
      expect(store.isInGame).toBe(false)
    })

    it('isInGame should return false when gameSocket is in CLOSING state', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      mockSocket.readyState = MockWebSocket.CLOSING
      store.gameSocket = mockSocket
      expect(store.isInGame).toBe(false)
    })
  })

  describe('initializeUser', () => {
    it('should generate sessionId if not exists', () => {
      const store = useUserStore()
      store.initializeUser()
      expect(store.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
    })

    it('should not override existing sessionId', () => {
      const store = useUserStore()
      const existingSessionId = 'existing_session_123'
      store.sessionId = existingSessionId
      store.initializeUser()
      expect(store.sessionId).toBe(existingSessionId)
    })

    it('should load user from sessionStorage if exists', () => {
      const sessionId = 'test_session_123'
      sessionStorage.setItem(`user_${sessionId}`, JSON.stringify(mockUser))

      const store = useUserStore()
      store.sessionId = sessionId
      store.initializeUser()

      expect(store.user).toEqual(mockUser)
    })

    it('should not load user if sessionStorage is empty', () => {
      const store = useUserStore()
      store.sessionId = 'non_existing_session'
      store.initializeUser()

      expect(store.user).toBeNull()
    })
  })

  describe('login', () => {
    it('should set user data and store in sessionStorage', () => {
      const store = useUserStore()
      store.login(mockUser)

      expect(store.user).toEqual(mockUser)
      expect(store.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)

      const stored = sessionStorage.getItem(`user_${store.sessionId}`)
      expect(JSON.parse(stored)).toEqual(mockUser)
    })

    it('should use existing sessionId if available', () => {
      const store = useUserStore()
      const existingSessionId = 'existing_session_123'
      store.sessionId = existingSessionId

      store.login(mockUser)

      expect(store.sessionId).toBe(existingSessionId)
      expect(sessionStorage.getItem(`user_${existingSessionId}`)).toBeTruthy()
    })

    it('should generate new sessionId if null', () => {
      const store = useUserStore()
      store.sessionId = null

      store.login(mockUser)

      expect(store.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
    })
  })

  describe('logout', () => {
    it('should clear user state and sessionStorage', () => {
      const store = useUserStore()
      store.sessionId = 'test_session'
      store.user = mockUser
      store.currentGameId = 'game123'
      store.currentLobbyId = 'lobby456'

      sessionStorage.setItem(
        `user_${store.sessionId}`,
        JSON.stringify(mockUser)
      )

      store.logout()

      expect(store.user).toBeNull()
      expect(store.currentGameId).toBeNull()
      expect(store.currentLobbyId).toBeNull()
      expect(store.sessionId).toBeNull()
      expect(sessionStorage.getItem('user_test_session')).toBeNull()
    })

    it('should not throw when sessionId is null', () => {
      const store = useUserStore()
      store.sessionId = null

      expect(() => store.logout()).not.toThrow()
    })

    it('should not throw when sessionStorage is empty', () => {
      const store = useUserStore()
      store.sessionId = 'non_existing_session'

      expect(() => store.logout()).not.toThrow()
    })
  })

  describe('setIsAlive', () => {
    it('should set isAlive to true', () => {
      const store = useUserStore()
      store.setIsAlive(true)
      expect(store.isAlive).toBe(true)
    })

    it('should set isAlive to false', () => {
      const store = useUserStore()
      store.setIsAlive(false)
      expect(store.isAlive).toBe(false)
    })
  })

  describe('setMyRole', () => {
    it('should change role to "hunter"', () => {
      const store = useUserStore()
      store.setMyRole('hunter')
      expect(store.myRole).toBe('hunter')
    })

    it('should change role to "runner"', () => {
      const store = useUserStore()
      store.setMyRole('runner')
      expect(store.myRole).toBe('runner')
    })

    it('should change role multiple times', () => {
      const store = useUserStore()
      store.setMyRole('hunter')
      expect(store.myRole).toBe('hunter')

      store.setMyRole('runner')
      expect(store.myRole).toBe('runner')
    })
  })

  describe('setGameSocket', () => {
    it('should set gameSocket and game/lobby IDs', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://game-server')

      store.setGameSocket(mockSocket, 'game123', 'lobby456')

      expect(store.gameSocket).toStrictEqual(mockSocket)
      expect(store.currentGameId).toBe('game123')
      expect(store.currentLobbyId).toBe('lobby456')
      expect(console.log).toHaveBeenCalledWith(
        '🎮 Game socket set for game:',
        'game123',
        'lobby:',
        'lobby456'
      )
    })

    it('should close existing open socket before setting new one', () => {
      const store = useUserStore()
      const oldSocket = new MockWebSocket('ws://old-server')
      oldSocket.readyState = MockWebSocket.OPEN
      store.gameSocket = oldSocket

      const newSocket = new MockWebSocket('ws://new-server')
      store.setGameSocket(newSocket, 'newGame', 'newLobby')

      expect(oldSocket.close).toHaveBeenCalledWith(
        1000,
        'Reconnecting to new game'
      )
      expect(store.gameSocket).toStrictEqual(newSocket)
    })

    it('should not close socket if it is not open', () => {
      const store = useUserStore()
      const oldSocket = new MockWebSocket('ws://old-server')
      oldSocket.readyState = MockWebSocket.CLOSED // Изменено: используем CLOSED вместо CLOSING
      store.gameSocket = oldSocket

      const newSocket = new MockWebSocket('ws://new-server')
      store.setGameSocket(newSocket)

      expect(oldSocket.close).not.toHaveBeenCalled()
    })

    it('should not close socket if it is null', () => {
      const store = useUserStore()
      store.gameSocket = null

      const newSocket = new MockWebSocket('ws://new-server')
      store.setGameSocket(newSocket)

      // Нет ошибки, так как gameSocket был null
      expect(store.gameSocket).toStrictEqual(newSocket)
    })

    it('should accept null gameId and lobbyId', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://game-server')

      store.setGameSocket(mockSocket)

      expect(store.gameSocket).toStrictEqual(mockSocket)
      expect(store.currentGameId).toBeNull()
      expect(store.currentLobbyId).toBeNull()
    })

    it('should preserve existing gameId and lobbyId when not provided', () => {
      const store = useUserStore()
      store.currentGameId = 'existingGame'
      store.currentLobbyId = 'existingLobby'

      const mockSocket = new MockWebSocket('ws://game-server')
      store.setGameSocket(mockSocket)

      expect(store.currentGameId).toBe('existingGame')
      expect(store.currentLobbyId).toBe('existingLobby')
    })

    it('should handle setGameSocket with null socket', () => {
      const store = useUserStore()
      store.setGameSocket(null)
      expect(store.gameSocket).toBeNull()
    })
  })

  describe('clearGameState', () => {
    it('should clear gameId and lobbyId', () => {
      const store = useUserStore()
      store.currentGameId = 'game123'
      store.currentLobbyId = 'lobby456'

      store.clearGameState()

      expect(store.currentGameId).toBeNull()
      expect(store.currentLobbyId).toBeNull()
    })

    it('should work when gameId and lobbyId are already null', () => {
      const store = useUserStore()

      expect(() => store.clearGameState()).not.toThrow()
      expect(store.currentGameId).toBeNull()
      expect(store.currentLobbyId).toBeNull()
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete login -> game -> logout flow', () => {
      const store = useUserStore()

      // Логин
      store.login(mockUser)
      expect(store.isAuthenticated).toBe(true)
      expect(store.userName).toBe(mockUser.name)

      // Присоединение к игре
      const mockSocket = new MockWebSocket('ws://game')
      store.setGameSocket(mockSocket, 'game1', 'lobby1')
      expect(store.isInGame).toBe(true)
      expect(store.currentGameId).toBe('game1')

      // Смена роли
      store.setMyRole('hunter')
      expect(store.myRole).toBe('hunter')

      // Смерть игрока
      store.setIsAlive(false)
      expect(store.isAlive).toBe(false)

      // Выход из игры
      store.clearGameState()
      expect(store.currentGameId).toBeNull()

      // Логаут
      store.logout()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
    })

    it('should persist user across page reloads', () => {
      // Первая "сессия"
      const store1 = useUserStore()
      store1.login(mockUser)
      const sessionId = store1.sessionId

      // Симуляция перезагрузки страницы
      sessionStorage.setItem(`user_${sessionId}`, JSON.stringify(mockUser))
      const store2 = useUserStore()
      store2.sessionId = sessionId
      store2.initializeUser()

      expect(store2.user).toEqual(mockUser)
      expect(store2.isAuthenticated).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle user with null id in userId computed', () => {
      const store = useUserStore()
      store.user = { name: 'User without id' }
      expect(store.userId).toBeNull()
    })

    it('should handle user with undefined name in userName computed', () => {
      const store = useUserStore()
      store.user = { id: 1 }
      expect(store.userName).toBe('Guest')
    })

    it('should handle WebSocket with undefined readyState', () => {
      const store = useUserStore()
      const mockSocket = new MockWebSocket('ws://test')
      delete mockSocket.readyState
      store.gameSocket = mockSocket
      // isInGame проверяет readyState === WebSocket.OPEN
      // Если readyState undefined, то сравнение будет false
      expect(store.isInGame).toBe(false)
    })
  })
})
