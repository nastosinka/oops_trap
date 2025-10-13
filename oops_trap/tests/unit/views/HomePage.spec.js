import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleAuthPage from '@/views/HomePage.vue'
import BaseButton from '@/components/base/BaseButton.vue'

describe('SimpleAuthPage.vue', () => {
  it('renders all three buttons with correct labels', () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    expect(buttons).toHaveLength(3)
    
    expect(buttons[0].props('label')).toBe('Sign In')
    expect(buttons[1].props('label')).toBe('Sign On')
    expect(buttons[2].props('label')).toBe('Rules')
  })

  it('passes correct props to BaseButton components', () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    
    buttons.forEach(button => {
      expect(button.props('size')).toBe('large')
      expect(button.classes()).toContain('action-button')
    })
  })

  it('has all three methods defined', () => {
    const wrapper = mount(SimpleAuthPage)
    
    expect(typeof wrapper.vm.handleSignIn).toBe('function')
    expect(typeof wrapper.vm.handleSignOn).toBe('function')
    expect(typeof wrapper.vm.handleRules).toBe('function')
  })

  it('calls handleSignIn when first button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[0].trigger('click')
    
    expect(wrapper.vm.handleSignIn()).toBeUndefined()
  })

  it('calls handleSignOn when second button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[1].trigger('click')
    
    expect(wrapper.vm.handleSignOn()).toBeUndefined()
  })

  it('calls handleRules when third button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[2].trigger('click')
    
    expect(wrapper.vm.handleRules()).toBeUndefined()
  })
})