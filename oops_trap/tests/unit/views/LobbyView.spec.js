import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LobbyView from '@/views/LobbyView.vue'

describe('LobbyView.vue', () => {
  it('renders home page with correct title', () => {
    const wrapper = mount(LobbyView)
    
    expect(wrapper.text()).toContain('Игровое лобби')
    expect(wrapper.text()).toContain('Ожидание игроков...')
  })

  it('has start game button', () => {
    const wrapper = mount(LobbyView)
    
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Начать игру')
  })

  it('displays the player', () => {
    const wrapper = mount(LobbyView)
    
    expect(wrapper.text()).toContain('Игрок')
  })
})
