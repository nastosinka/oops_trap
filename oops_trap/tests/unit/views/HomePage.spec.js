import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleAuthPage from '@/views/HomePage.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AuthModal from '@/components/base/AuthModal.vue'

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

  it('opens sign in modal when first button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[0].trigger('click')
    
    expect(wrapper.vm.showSignInModal).toBe(true)
    expect(wrapper.findComponent(AuthModal).exists()).toBe(true)
    expect(wrapper.findComponent(AuthModal).props('title')).toBe('Sign In')
  })

  it('opens sign on modal when second button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[1].trigger('click')
    
    expect(wrapper.vm.showSignOnModal).toBe(true)
  })

  it('opens rules modal when third button is clicked', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    const buttons = wrapper.findAllComponents(BaseButton)
    await buttons[2].trigger('click')
    
    expect(wrapper.vm.showRulesModal).toBe(true)
  })

  it('closes sign in modal when AuthModal emits close event', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    wrapper.vm.showSignInModal = true
    await wrapper.vm.$nextTick()
    
    wrapper.findComponent(AuthModal).vm.$emit('close')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.showSignInModal).toBe(false)
  })

  it('calls handleSignIn and closes modal when AuthModal emits submit event', async () => {
    const wrapper = mount(SimpleAuthPage)
    const mockFormData = { email: 'test@example.com', password: 'password' }
    
    const handleSignInSpy = vi.spyOn(wrapper.vm, 'handleSignIn')
    
    wrapper.vm.showSignInModal = true
    await wrapper.vm.$nextTick()
    
    wrapper.findComponent(AuthModal).vm.$emit('submit', mockFormData)
    await wrapper.vm.$nextTick()
    
    expect(handleSignInSpy).toHaveBeenCalledWith(mockFormData)
    expect(wrapper.vm.showSignInModal).toBe(false)
    
    handleSignInSpy.mockRestore()
  })

  it('has all required methods defined', () => {
    const wrapper = mount(SimpleAuthPage)
    
    expect(typeof wrapper.vm.handleSignIn).toBe('function')
    expect(typeof wrapper.vm.handleSignOn).toBe('function')
  })

  it('renders AuthModal only when showSignInModal is true', async () => {
    const wrapper = mount(SimpleAuthPage)
    
    expect(wrapper.findComponent(AuthModal).exists()).toBe(false)

    wrapper.vm.showSignInModal = true
    await wrapper.vm.$nextTick()
    
    expect(wrapper.findComponent(AuthModal).exists()).toBe(true)
  })
})