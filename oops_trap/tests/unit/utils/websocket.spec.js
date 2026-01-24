import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGameSocket } from '@/utils/websocket.js'

// Мокаем глобальные объекты
const mockWebSocket = vi.fn(function (url) {
  this.url = url
})
const originalWebSocket = global.WebSocket
const originalLocation = window.location
const originalConsoleLog = console.log

describe('createGameSocket', () => {
  beforeEach(() => {
    global.WebSocket = mockWebSocket
    console.log = vi.fn()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    global.WebSocket = originalWebSocket
    console.log = originalConsoleLog
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  test('должен создавать WebSocket с ws протоколом для http', () => {
    // Arrange
    const lobbyId = 'test-lobby-123'
    delete window.location
    window.location = {
      protocol: 'http:'
    }

    // Act
    createGameSocket(lobbyId)

    // Assert
    expect(mockWebSocket).toHaveBeenCalledTimes(1)
    expect(mockWebSocket).toHaveBeenCalledWith(
      'ws://localhost/ws/game/test-lobby-123'
    )
    expect(console.log).toHaveBeenCalledWith(
      'ws://localhost/ws/game/test-lobby-123'
    )
  })

  test('должен создавать WebSocket с wss протоколом для https', () => {
    // Arrange
    const lobbyId = 'secure-lobby-456'
    delete window.location
    window.location = {
      protocol: 'https:'
    }

    // Act
    createGameSocket(lobbyId)

    // Assert
    expect(mockWebSocket).toHaveBeenCalledTimes(1)
    expect(mockWebSocket).toHaveBeenCalledWith(
      'wss://localhost/ws/game/secure-lobby-456'
    )
    expect(console.log).toHaveBeenCalledWith(
      'wss://localhost/ws/game/secure-lobby-456'
    )
  })

  test('должен использовать VITE_SERVER_IP2 если он задан', () => {
    const lobbyId = 'env-lobby-789'

    delete window.location
    window.location = {
      protocol: 'http:'
    }

    vi.stubEnv('VITE_SERVER_IP2', 'api.example.com')

    createGameSocket(lobbyId)

    expect(mockWebSocket).toHaveBeenCalledTimes(1)
    expect(mockWebSocket).toHaveBeenCalledWith(
      'ws://api.example.com/ws/game/env-lobby-789'
    )
    expect(console.log).toHaveBeenCalledWith(
      'ws://api.example.com/ws/game/env-lobby-789'
    )
  })

  test('должен использовать localhost если VITE_SERVER_IP2 не задан', () => {
    const lobbyId = 'default-lobby-999'

    delete window.location
    window.location = { protocol: 'http:' }

    vi.unstubAllEnvs()

    createGameSocket(lobbyId)

    expect(mockWebSocket).toHaveBeenCalledWith(
      'ws://localhost/ws/game/default-lobby-999'
    )
  })

  test('должен использовать VITE_SERVER_IP2 если он задан как пустая строка', () => {
    // Arrange
    const lobbyId = 'empty-host-lobby'
    delete window.location
    window.location = {
      protocol: 'http:'
    }

    vi.stubEnv('VITE_SERVER_IP2', '')

    // Act
    createGameSocket(lobbyId)

    // Assert
    expect(mockWebSocket).toHaveBeenCalledTimes(1)
    expect(mockWebSocket).toHaveBeenCalledWith(
      'ws://localhost/ws/game/empty-host-lobby'
    )
    expect(console.log).toHaveBeenCalledWith(
      'ws://localhost/ws/game/empty-host-lobby'
    )
  })

  test('должен корректно работать с различными форматами lobbyId', () => {
    // Arrange
    const testCases = [
      { lobbyId: '123', expected: 'ws://localhost/ws/game/123' },
      {
        lobbyId: 'abc-def-ghi',
        expected: 'ws://localhost/ws/game/abc-def-ghi'
      },
      {
        lobbyId: 'lobby_with_underscore',
        expected: 'ws://localhost/ws/game/lobby_with_underscore'
      },
      {
        lobbyId: 'LOBBY-UPPERCASE',
        expected: 'ws://localhost/ws/game/LOBBY-UPPERCASE'
      },
      { lobbyId: '123/456', expected: 'ws://localhost/ws/game/123/456' } // Слэш в ID
    ]

    delete window.location
    window.location = {
      protocol: 'http:'
    }

    // Act & Assert
    testCases.forEach(({ lobbyId, expected }) => {
      mockWebSocket.mockClear()
      console.log.mockClear()

      createGameSocket(lobbyId)

      expect(mockWebSocket).toHaveBeenCalledWith(expected)
      expect(console.log).toHaveBeenCalledWith(expected)
    })
  })

  test('должен возвращать экземпляр WebSocket', () => {
    // Arrange
    const lobbyId = 'return-test-lobby'
    const mockWebSocketInstance = { readyState: 0 }
    mockWebSocket.mockReturnValue(mockWebSocketInstance)

    delete window.location
    window.location = {
      protocol: 'http:'
    }

    // Act
    const result = createGameSocket(lobbyId)

    // Assert
    expect(result).toBe(mockWebSocketInstance)
    expect(mockWebSocket).toHaveBeenCalledTimes(1)
  })

  test('должен логировать URL даже если WebSocket бросает исключение', () => {
    // Arrange
    const lobbyId = 'error-lobby'
    const error = new Error('WebSocket creation failed')
    mockWebSocket.mockImplementation(() => {
      throw error
    })

    delete window.location
    window.location = {
      protocol: 'http:'
    }

    // Act & Assert
    expect(() => createGameSocket(lobbyId)).toThrow(error)
    expect(console.log).toHaveBeenCalledWith(
      'ws://localhost/ws/game/error-lobby'
    )
  })
})
