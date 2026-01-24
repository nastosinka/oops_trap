import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CurrentPlayer from '@/components/game/player/general/CurrentPlayer.vue'

describe('CurrentPlayer - Comprehensive Tests', () => {
  let wrapper
  let emitSpy
  let rafSpy

  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем requestAnimationFrame
    rafSpy = vi.fn()
    global.requestAnimationFrame = vi.fn(cb => {
      rafSpy(cb)
      return 123
    })
    global.cancelAnimationFrame = vi.fn()

    // Мокаем таймеры
    vi.useFakeTimers()

    // Мокаем изображения
    global.Image = vi.fn(() => ({
      src: '',
      onload: null,
      onerror: null
    }))
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  const createWrapper = (props = {}, options = {}) => {
    const defaultProps = {
      gameArea: { scale: 1 },
      polygons: [],
      ...props
    }

    wrapper = mount(CurrentPlayer, {
      props: defaultProps,
      global: {
        stubs: {
          // Можно добавить стабы если нужно
        }
      },
      ...options
    })

    emitSpy = vi.spyOn(wrapper.vm, '$emit')
    return wrapper
  }

  // 1. Базовые тесты жизненного цикла
  describe('Lifecycle', () => {
    it('должен добавлять обработчики событий при монтировании', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      createWrapper()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keyup',
        expect.any(Function)
      )
    })

    it('должен удалять обработчики событий при размонтировании', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const wrapper = createWrapper()

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keyup',
        expect.any(Function)
      )
    })

    it('должен запускать игровой цикл при монтировании', () => {
      createWrapper()

      expect(global.requestAnimationFrame).toHaveBeenCalled()
      expect(rafSpy).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  // 2. Тесты обработки ввода
  describe('Input Handling', () => {
    it('должен обрабатывать нажатие клавиш (английская раскладка)', () => {
      const wrapper = createWrapper()

      const event = new KeyboardEvent('keydown', { key: 'd' })
      window.dispatchEvent(event)

      expect(wrapper.vm.keys.has('d')).toBe(true)
      expect(wrapper.vm.dir).toBe('right')
    })

    it('должен обрабатывать нажатие клавиш (русская раскладка)', () => {
      const wrapper = createWrapper()

      const event = new KeyboardEvent('keydown', { key: 'в' })
      window.dispatchEvent(event)

      expect(wrapper.vm.keys.has('d')).toBe(true)
      expect(wrapper.vm.dir).toBe('right')
    })

    it('должен обрабатывать отпускание клавиш', () => {
      const wrapper = createWrapper()
      wrapper.vm.keys.add('d')

      const event = new KeyboardEvent('keyup', { key: 'd' })
      window.dispatchEvent(event)

      expect(wrapper.vm.keys.has('d')).toBe(false)
    })

    it('должен определять состояние walking при активном движении', () => {
      const wrapper = createWrapper()

      expect(wrapper.vm.isWalking).toBe(false)

      wrapper.vm.keys.add('d')
      expect(wrapper.vm.isWalking).toBe(true)

      wrapper.vm.keys.delete('d')
      wrapper.vm.keys.add('w')
      expect(wrapper.vm.isWalking).toBe(true)
    })
  })

  // 3. Тесты физики и коллизий
  describe('Physics and Collisions', () => {
    it('должен применять гравитацию в воздухе', () => {
      const wrapper = createWrapper()
      wrapper.vm.isOnGround = false
      wrapper.vm.velocity.y = 0

      const initialY = wrapper.vm.pos.y
      wrapper.vm.loop()

      expect(wrapper.vm.velocity.y).toBe(wrapper.vm.gravity)
      expect(wrapper.vm.pos.y).toBeGreaterThan(initialY)
    })

    it('должен останавливаться при ударе о потолок', () => {
      const wrapper = createWrapper()
      wrapper.vm.velocity.y = -5
      wrapper.vm.checkCeiling = vi.fn().mockReturnValue(true)

      wrapper.vm.loop()

      expect(wrapper.vm.velocity.y).toBe(0)
    })

    it('должен приземляться на землю', () => {
      const wrapper = createWrapper()
      wrapper.vm.isOnGround = false
      wrapper.vm.velocity.y = 5
      wrapper.vm.checkGround = vi.fn().mockReturnValue(true)

      wrapper.vm.loop()

      expect(wrapper.vm.isOnGround).toBe(true)
      expect(wrapper.vm.velocity.y).toBe(0)
    })

    it('должен блокировать движение при столкновении со стеной', () => {
      const wrapper = createWrapper()
      wrapper.vm.keys.add('d')
      wrapper.vm.checkWall = vi.fn().mockReturnValue(true)

      const initialX = wrapper.vm.pos.x
      wrapper.vm.loop()

      expect(wrapper.vm.pos.x).toBe(initialX) // Не должен двигаться
    })

    it('должен подниматься по ступенькам высотой до 6px', () => {
      const wrapper = createWrapper()
      wrapper.vm.keys.add('d')

      let wallCalls = 0
      wrapper.vm.checkWall = vi.fn().mockImplementation(() => {
        wallCalls++
        return wallCalls <= 3 // Сначала есть стена, потом после подъема её нет
      })
      wrapper.vm.checkCeiling = vi.fn().mockReturnValue(false)

      const initialY = wrapper.vm.pos.y
      wrapper.vm.loop()

      // Должен подняться на несколько пикселей
      expect(wrapper.vm.pos.y).toBeLessThan(initialY)
    })
  })

  // 4. Тесты специальных механик
  describe('Special Mechanics', () => {
    it('должен прыгать с каната по клавише Q', () => {
      const wrapper = createWrapper()
      wrapper.vm.polygonUnderPlayer = vi.fn().mockImplementation(type => {
        return type === 'rope'
      })
      wrapper.vm.keys.add('q')

      wrapper.vm.loop()

      expect(wrapper.vm.velocity.y).toBe(-6.7)
      expect(wrapper.vm.velocity.x).toBe(-9)
      expect(wrapper.vm.dir).toBe('left')
      expect(wrapper.vm.onVine).toBe(false)
    })

    it('должен двигаться по канату вертикально', () => {
      const wrapper = createWrapper()
      wrapper.vm.polygonUnderPlayer = vi.fn().mockImplementation(type => {
        return type === 'vine'
      })

      wrapper.vm.keys.add('w')
      const initialY = wrapper.vm.pos.y
      wrapper.vm.loop()

      expect(wrapper.vm.onVine).toBe(true)
      expect(wrapper.vm.pos.y).toBeLessThan(initialY)
      expect(wrapper.vm.velocity.y).toBe(0)
    })

    it('должен плавать в воде', () => {
      const wrapper = createWrapper()
      wrapper.vm.polygonUnderPlayer = vi.fn().mockImplementation(type => {
        return type === 'water'
      })
      wrapper.vm.checkGround = vi.fn().mockReturnValue(false)

      wrapper.vm.keys.add('w')
      const initialY = wrapper.vm.pos.y
      wrapper.vm.loop()

      // Должен двигаться со скоростью speed/2
      expect(wrapper.vm.pos.y).toBe(initialY - wrapper.vm.speed / 2)
    })

    it('должен замедляться при горизонтальном движении после прыжка', () => {
      const wrapper = createWrapper()
      wrapper.vm.velocity.x = 10

      wrapper.vm.loop()

      expect(wrapper.vm.velocity.x).toBe(9.5) // Уменьшилось на 0.5
    })
  })

  // 5. Тесты респавна
  describe('Respawn and Hazard Zones', () => {
    it('не должен респавниться повторно до истечения таймера', () => {
      const wrapper = createWrapper()

      wrapper.vm.polygonUnderPlayer = vi.fn().mockImplementation(type => {
        return type === 'spike'
      })

      wrapper.vm.loop()
      expect(wrapper.vm.respawnTimeout).toBeTruthy()

      // Еще один вызов не должен создавать новый таймаут
      const initialTimeout = wrapper.vm.respawnTimeout
      wrapper.vm.loop()
      expect(wrapper.vm.respawnTimeout).toBe(initialTimeout)
    })
  })

  // 6. Тесты анимации и рендеринга
  describe('Animation and Rendering', () => {
    it('должен обновлять кадр анимации при ходьбе', () => {
      const wrapper = createWrapper()
      const initialFrame = wrapper.vm.currentFrame

      wrapper.vm.keys.add('d')
      wrapper.vm.loop()

      expect(wrapper.vm.currentFrame).toBe((initialFrame + 1) % 3)
    })

    it('не должен обновлять кадр анимации при стоянии на месте', () => {
      const wrapper = createWrapper()
      const initialFrame = wrapper.vm.currentFrame

      wrapper.vm.loop()

      expect(wrapper.vm.currentFrame).toBe(initialFrame)
    })

    it('должен правильно вычислять стили трансформации', () => {
      const wrapper = createWrapper()
      wrapper.vm.pos = { x: 100.123, y: 200.456 }
      wrapper.vm.dir = 'left'

      const style = wrapper.vm.playerStyle

      expect(style.transform).toContain('translate(100px, 200px)')
      expect(style.transform).toContain('scaleX(-1)')
      expect(style.width).toBe('24px')
      expect(style.height).toBe('48px')
    })
  })

  // 7. Тесты синхронизации координат
  describe('Coordinate Synchronization', () => {
    it('не должен отправлять координаты если позиция не изменилась', () => {
      const wrapper = createWrapper()
      wrapper.vm.lastSentPos = { x: 100, y: 100 }
      wrapper.vm.pos = { x: 100, y: 100 }
      wrapper.vm.lastSendTime = Date.now() - 100

      wrapper.vm.sendCoords()

      expect(emitSpy).not.toHaveBeenCalled()
    })
  })

  // 8. Тесты вспомогательных методов
  describe('Helper Methods', () => {
    it('должен корректно округлять позиции при добавлении значений', () => {
      const wrapper = createWrapper()
      wrapper.vm.pos = { x: 100.111, y: 200.222 }

      wrapper.vm.addToX(0.123)
      wrapper.vm.addToY(0.456)
      wrapper.vm.subtractFromY(0.111)

      expect(wrapper.vm.pos.x).toBeCloseTo(100.23, 2)
      expect(wrapper.vm.pos.y).toBeCloseTo(200.57, 2)
    })

    it('не должен падать при отсутствии спавн-полигона', () => {
      const wrapper = createWrapper({
        polygons: []
      })

      const initialPos = { ...wrapper.vm.pos }

      wrapper.vm.setSpawnFromPolygon()

      // Позиция не должна измениться
      expect(wrapper.vm.pos).toEqual(initialPos)
    })
  })

  // 9. Тесты граничных случаев
  describe('Edge Cases', () => {
    it('должен обрабатывать несколько одновременных нажатий клавиш', () => {
      const wrapper = createWrapper()

      wrapper.vm.keys.add('w')
      wrapper.vm.keys.add('a')
      wrapper.vm.keys.add('d')

      expect(wrapper.vm.keys.has('w')).toBe(true)
      expect(wrapper.vm.keys.has('a')).toBe(true)
      expect(wrapper.vm.keys.has('d')).toBe(true)
      expect(wrapper.vm.dir).toBe('right') // D имеет приоритет для направления
    })

    it('должен корректно работать с очень маленьким масштабом', () => {
      const wrapper = createWrapper({
        gameArea: { scale: 0.1 }
      })

      const style = wrapper.vm.playerStyle
      expect(style.transform).toBeDefined()
    })

    it('должен корректно работать с отрицательными координатами', () => {
      const wrapper = createWrapper()
      wrapper.vm.pos = { x: -100, y: -200 }

      const style = wrapper.vm.playerStyle
      expect(style.transform).toContain('-100px')
      expect(style.transform).toContain('-200px')
    })

    it('должен выдерживать высокую частоту кадров', () => {
      const wrapper = createWrapper()
      wrapper.vm.keys.add('d')

      // Симулируем несколько быстрых вызовов loop
      for (let i = 0; i < 10; i++) {
        wrapper.vm.loop()
      }

      // Позиция должна увеличиться
      expect(wrapper.vm.pos.x).toBeGreaterThan(1850)
    })
  })
})
