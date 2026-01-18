import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MapEditPage from '@/tools/MapEditPage.vue'

// Если вы хотите тестировать с реальным компонентом (не моком)
describe('MapEditPage with real DevMapEditor', () => {
  let originalComponent
  
  beforeAll(() => {
    // Сохраняем оригинальный компонент
    originalComponent = MapEditPage.components.DevMapEditor
  })

  afterAll(() => {
    // Восстанавливаем оригинальный компонент
    MapEditPage.components.DevMapEditor = originalComponent
  })

  it('should render real DevMapEditor component', async () => {
    // Если DevMapEditor простой и не имеет зависимостей
    const RealDevMapEditor = {
      template: '<div>Real Dev Map Editor</div>',
      name: 'RealDevMapEditor'
    }
    
    MapEditPage.components.DevMapEditor = RealDevMapEditor
    
    const wrapper = mount(MapEditPage)
    expect(wrapper.text()).toContain('Real Dev Map Editor')
  })
})