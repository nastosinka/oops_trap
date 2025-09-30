import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameView from '@/views/GameView.vue'

describe('GameView.vue', () => {
  it('renders home page with correct title', () => {
    const wrapper = mount(GameView)
    
    expect(wrapper.text()).toContain('Игровая плазма')
    expect(wrapper.text()).toContain('Игра началась!')
  })

  it('has end game button', () => {
    const wrapper = mount(GameView)
    
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Завершить игру')
  })

  it('displays the playing field', () => {
    const wrapper = mount(GameView)
    
    expect(wrapper.text()).toContain('Игровое поле будет здесь')
  })
})
