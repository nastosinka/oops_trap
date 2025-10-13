import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useRouter } from 'vue-router'
import GameView from '@/views/GameView.vue'

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

describe('GameView.vue', () => {
  it('renders game screen with correct elements', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    })
    
    const wrapper = mount(GameView)
    
    expect(wrapper.find('h2').text()).toBe('🎯 Игровой экран')
    expect(wrapper.find('p').text()).toBe('Игра началась!')
    expect(wrapper.find('.canvas-placeholder span').text()).toBe('Игровое поле будет здесь')
    expect(wrapper.find('.results-button').text()).toBe('Завершить игру')
  })

  it('navigates to results when button is clicked', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    })
    
    const wrapper = mount(GameView)
    
    await wrapper.find('.results-button').trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/results')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('calls goToResults method', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    })
    
    const wrapper = mount(GameView)
    
    await wrapper.find('.results-button').trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/results')
  })
})