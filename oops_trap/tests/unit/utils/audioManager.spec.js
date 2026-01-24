import { audioManager } from '@/utils/audioManager'
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Мокаем Web Audio API
global.window = {
  AudioContext: class {
    constructor() {
      this.state = 'running'
      this.destination = {}
      this.currentTime = 0
    }
    createGain() {
      return {
        gain: {
          value: 1,
          cancelScheduledValues: vi.fn(),
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn()
      }
    }
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      }
    }
    decodeAudioData() {
      return Promise.resolve({})
    }
    resume() {
      return Promise.resolve()
    }
  },
  webkitAudioContext: undefined
}

// Мокаем fetch
global.fetch = vi.fn()
global.setTimeout = vi.fn(fn => fn())

describe('AudioManager', () => {
  let manager

  beforeEach(() => {
    // Создаем новый инстанс для каждого теста
    manager = new audioManager.constructor()
    vi.clearAllMocks()
  })

  describe('init', () => {
    test('should create AudioContext and masterGain', async () => {
      await manager.init()

      expect(manager.audioContext).toBeDefined()
      expect(manager.masterGain).toBeDefined()
      expect(manager.masterGain.gain.value).toBe(0.5)
    })

    test('should not recreate AudioContext if already exists', async () => {
      const mockContext = { test: 'context' }
      manager.audioContext = mockContext

      await manager.init()

      expect(manager.audioContext).toBe(mockContext)
    })
  })

  describe('unlock', () => {
    test('should init and resume if suspended', async () => {
      manager.audioContext = {
        state: 'suspended',
        resume: vi.fn(() => Promise.resolve()),
        destination: {},
        createGain: vi.fn(() => ({
          gain: { value: 0.5 },
          connect: vi.fn()
        }))
      }

      await manager.unlock()

      expect(manager.audioContext.resume).toHaveBeenCalled()
      expect(manager.unlocked).toBe(true)
    })

    test('should not resume if already running', async () => {
      manager.audioContext = {
        state: 'running',
        resume: vi.fn(),
        destination: {},
        createGain: vi.fn(() => ({
          gain: { value: 0.5 },
          connect: vi.fn()
        }))
      }

      await manager.unlock()

      expect(manager.audioContext.resume).not.toHaveBeenCalled()
      expect(manager.unlocked).toBe(true)
    })
  })

  describe('load', () => {
    test('should load audio buffer', async () => {
      const mockArrayBuffer = new ArrayBuffer(8)
      const mockBuffer = { audio: 'buffer' }

      fetch.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      })

      manager.audioContext = {
        decodeAudioData: vi.fn(() => Promise.resolve(mockBuffer)),
        destination: {},
        createGain: vi.fn(() => ({
          gain: { value: 0.5 },
          connect: vi.fn()
        }))
      }

      await manager.load('testSound', 'audio/test.mp3')

      expect(fetch).toHaveBeenCalledWith('audio/test.mp3')
      expect(manager.audioContext.decodeAudioData).toHaveBeenCalledWith(
        mockArrayBuffer
      )
      expect(manager.buffers.has('testSound')).toBe(true)
      expect(manager.buffers.get('testSound')).toBe(mockBuffer)
    })

    test('should not reload if already loaded', async () => {
      const mockBuffer = { audio: 'buffer' }
      manager.buffers.set('testSound', mockBuffer)
      manager.audioContext = {
        destination: {},
        createGain: vi.fn(() => ({
          gain: { value: 0.5 },
          connect: vi.fn()
        }))
      }

      await manager.load('testSound', 'audio/test.mp3')

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('playMusic', () => {
    beforeEach(() => {
      manager.audioContext = {
        createBufferSource: vi.fn(() => ({
          buffer: null,
          loop: false,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn()
        })),
        createGain: vi.fn(() => ({
          gain: { value: 1 },
          connect: vi.fn(),
          disconnect: vi.fn()
        })),
        destination: {},
        currentTime: 100
      }
      manager.masterGain = { gain: { value: 0.5 } }
      manager.unlocked = true
    })

    test('should not play if not unlocked', async () => {
      manager.unlocked = false
      manager.buffers.set('music', {})

      await manager.playMusic('music')

      expect(manager.audioContext.createBufferSource).not.toHaveBeenCalled()
    })

    test('should not play same music twice', async () => {
      manager.buffers.set('music', {})
      manager.currentMusicName = 'music'

      await manager.playMusic('music')

      expect(manager.audioContext.createBufferSource).not.toHaveBeenCalled()
    })

    test('should not play if music not loaded', async () => {
      await manager.playMusic('nonExistent')

      expect(manager.audioContext.createBufferSource).not.toHaveBeenCalled()
    })

    test('should play music with correct parameters', async () => {
      const mockBuffer = { audio: 'buffer' }
      manager.buffers.set('music', mockBuffer)

      await manager.playMusic('music', { loop: false, volume: 0.7 })

      expect(manager.audioContext.createBufferSource).toHaveBeenCalled()
      expect(manager.audioContext.createGain).toHaveBeenCalled()

      const source =
        manager.audioContext.createBufferSource.mock.results[0].value
      const gain = manager.audioContext.createGain.mock.results[0].value

      expect(source.buffer).toBe(mockBuffer)
      expect(source.loop).toBe(false)
      expect(gain.gain.value).toBe(0.7)
      expect(source.start).toHaveBeenCalled()
      expect(manager.currentMusicName).toBe('music')
      expect(manager.currentMusic).toEqual({ source, gain })
    })

    test('should stop previous music before playing new', async () => {
      const mockSource = {
        stop: vi.fn(),
        disconnect: vi.fn()
      }
      const mockGain = { disconnect: vi.fn() }
      manager.currentMusic = { source: mockSource, gain: mockGain }
      manager.currentMusicName = 'oldMusic'
      manager.buffers.set('newMusic', {})

      await manager.playMusic('newMusic')

      expect(mockSource.stop).toHaveBeenCalled()
      expect(mockSource.disconnect).toHaveBeenCalled()
      expect(mockGain.disconnect).toHaveBeenCalled()
    })
  })

  describe('stopMusic', () => {
    test('should stop current music', () => {
      const mockSource = {
        stop: vi.fn(),
        disconnect: vi.fn()
      }
      const mockGain = { disconnect: vi.fn() }

      manager.currentMusic = { source: mockSource, gain: mockGain }
      manager.currentMusicName = 'music'

      manager.stopMusic()

      expect(mockSource.stop).toHaveBeenCalled()
      expect(mockSource.disconnect).toHaveBeenCalled()
      expect(mockGain.disconnect).toHaveBeenCalled()
      expect(manager.currentMusic).toBeNull()
      expect(manager.currentMusicName).toBeNull()
    })

    test('should do nothing if no music playing', () => {
      manager.stopMusic()
      // No error should be thrown
      expect(manager.currentMusic).toBeNull()
    })
  })

  describe('fadeOutMusic', () => {
    test('should do nothing if no music playing', () => {
      manager.fadeOutMusic()
      // No error should be thrown
    })
  })

  describe('playSfx', () => {
    beforeEach(() => {
      manager.audioContext = {
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn()
        })),
        createGain: vi.fn(() => ({
          gain: { value: 1 },
          connect: vi.fn()
        })),
        destination: {}
      }
      manager.masterGain = { gain: { value: 0.5 } }
      manager.unlocked = true
    })

    test('should not play if not unlocked', () => {
      manager.unlocked = false
      manager.buffers.set('sfx', {})

      manager.playSfx('sfx')

      expect(manager.audioContext.createBufferSource).not.toHaveBeenCalled()
    })

    test('should not play if sound not loaded', () => {
      manager.playSfx('nonExistent')

      expect(manager.audioContext.createBufferSource).not.toHaveBeenCalled()
    })

    test('should play sound effect with default volume', () => {
      const mockBuffer = { audio: 'buffer' }
      manager.buffers.set('sfx', mockBuffer)

      manager.playSfx('sfx')

      expect(manager.audioContext.createBufferSource).toHaveBeenCalled()
      expect(manager.audioContext.createGain).toHaveBeenCalled()

      const source =
        manager.audioContext.createBufferSource.mock.results[0].value
      const gain = manager.audioContext.createGain.mock.results[0].value

      expect(source.buffer).toBe(mockBuffer)
      expect(gain.gain.value).toBe(1)
      expect(source.start).toHaveBeenCalled()
    })

    test('should play sound effect with custom volume', () => {
      const mockBuffer = { audio: 'buffer' }
      manager.buffers.set('sfx', mockBuffer)

      manager.playSfx('sfx', { volume: 0.8 })

      const gain = manager.audioContext.createGain.mock.results[0].value
      expect(gain.gain.value).toBe(0.8)
    })
  })

  describe('playSfxWithVolume', () => {
    test('should play sound with specified volume', () => {
      const mockBuffer = { audio: 'buffer' }
      manager.buffers.set('sfx', mockBuffer)
      manager.unlocked = true
      manager.audioContext = {
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn()
        })),
        createGain: vi.fn(() => ({
          gain: { value: 1 },
          connect: vi.fn()
        })),
        destination: {}
      }
      manager.masterGain = { gain: { value: 0.5 } }

      manager.playSfxWithVolume('sfx', 0.6)

      const gain = manager.audioContext.createGain.mock.results[0].value
      expect(gain.gain.value).toBe(0.6)
    })
  })

  describe('setMasterVolume', () => {
    test('should set master volume', () => {
      const mockGain = { gain: { value: 0.5 } }
      manager.masterGain = mockGain

      manager.setMasterVolume(0.8)

      expect(mockGain.gain.value).toBe(0.8)
    })

    test('should do nothing if masterGain not initialized', () => {
      manager.masterGain = null

      manager.setMasterVolume(0.8)

      // No error should be thrown
      expect(manager.masterGain).toBeNull()
    })
  })
})
