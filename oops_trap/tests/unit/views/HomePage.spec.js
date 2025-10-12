import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameView from '@/views/HomePage.vue'

describe('GameView.vue', () => {
  it('has Sign In button', () => {
    const wrapper = mount(GameView)
    
    // Ищем все кнопки и фильтруем по тексту
    const buttons = wrapper.findAll('button')
    const signInButton = buttons.find(button => button.text() === 'Sign In')
    
    expect(signInButton?.exists()).toBe(true)
  })

  it('has Sign On button', () => {
    const wrapper = mount(GameView)
    
    const buttons = wrapper.findAll('button')
    const signOnButton = buttons.find(button => button.text() === 'Sign On')
    
    expect(signOnButton?.exists()).toBe(true)
  })

  it('has Rules button', () => {
    const wrapper = mount(GameView)
    
    const buttons = wrapper.findAll('button')
    const rulesButton = buttons.find(button => button.text() === 'Rules')
    
    expect(rulesButton?.exists()).toBe(true)
  })

  // Дополнительный тест для проверки общего количества кнопок
  it('has exactly three buttons', () => {
    const wrapper = mount(GameView)
    
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
  })
})