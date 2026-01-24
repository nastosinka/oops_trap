import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GameMap from '@/components/game/maps/background/FirstMapBackground.vue'

// Мокаем импорты
vi.mock('@/assets/images/maps/Map1/st/st1.png', () => ({
  default: 'st1-mock.png'
}))
vi.mock('@/assets/images/maps/Map1/st/st2.png', () => ({
  default: 'st2-mock.png'
}))
vi.mock('@/assets/images/maps/Map1/st/st3.png', () => ({
  default: 'st3-mock.png'
}))
vi.mock('@/assets/images/maps/Map1/st/st4.png', () => ({
  default: 'st4-mock.png'
}))
vi.mock('@/assets/images/maps/Map1/li/1.png', () => ({
  default: 'li1-mock.png'
}))

describe('GameMap Composition Tests', () => {
  it('должен сохранять структуру при обновлениях', async () => {
    const wrapper = mount(GameMap)

    // Получаем начальный HTML
    const initialHtml = wrapper.html()

    // Триггерим обновление (хотя в данном компоненте нет реактивных данных)
    await wrapper.vm.$forceUpdate()

    // Проверяем что структура не изменилась
    expect(wrapper.html()).toBe(initialHtml)
  })

  it('должен иметь правильные CSS классы', () => {
    const wrapper = mount(GameMap)

    const expectedClasses = [
      'game-map',
      'map-layer',
      'st1-layer',
      'st2-layer',
      'st3-layer',
      'st4-layer',
      'li1-layer'
    ]

    // Проверяем наличие всех ожидаемых классов в компоненте
    expectedClasses.forEach(className => {
      expect(wrapper.html()).toContain(className)
    })
  })
})
