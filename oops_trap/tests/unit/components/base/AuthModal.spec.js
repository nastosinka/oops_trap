import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthModal from '@/components/base/AuthModal.vue'
import AuthForm from '@/components/base/AuthForm.vue'

describe('AuthModal.vue', () => {
  it('renders modal with correct title', () => {
    const title = 'Test Modal Title'
    const wrapper = mount(AuthModal, {
      props: { title }
    })
    
    const titleElement = wrapper.find('.modal__title')
    expect(titleElement.exists()).toBe(true)
    expect(titleElement.text()).toBe(title)
  })

  it('renders with default title when no prop provided', () => {
    const wrapper = mount(AuthModal)
    
    const titleElement = wrapper.find('.modal__title')
    expect(titleElement.exists()).toBe(true)
    expect(titleElement.text()).toBe('Sign In')
  })

  it('renders AuthForm component', () => {
    const wrapper = mount(AuthModal)
    
    const authForm = wrapper.findComponent(AuthForm)
    expect(authForm.exists()).toBe(true)
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(AuthModal)
    
    const closeButton = wrapper.find('.modal__close')
    await closeButton.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close event when modal overlay is clicked', async () => {
    const wrapper = mount(AuthModal)
    
    const overlay = wrapper.find('.modal-overlay')
    await overlay.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close event when modal content is clicked', async () => {
    const wrapper = mount(AuthModal)
    
    const modalContent = wrapper.find('.modal')
    await modalContent.trigger('click')
    
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits submit event with form data when AuthForm submits', async () => {
    const wrapper = mount(AuthModal)
    
    const formData = {
      name: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123'
    }
    
    const authForm = wrapper.findComponent(AuthForm)
    authForm.vm.$emit('submit', formData)
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0]).toEqual([formData])
  })

  it('forwards form data from AuthForm to parent component', async () => {
    const wrapper = mount(AuthModal)
    
    const testData = {
      name: 'Test User',
      password: 'testpass',
      confirmPassword: 'testpass'
    }
    
    const authForm = wrapper.findComponent(AuthForm)
    await authForm.vm.$emit('submit', testData)
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual(testData)
  })

  it('has correct CSS classes structure', () => {
    const wrapper = mount(AuthModal)
    
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.find('.modal__header').exists()).toBe(true)
    expect(wrapper.find('.modal__title').exists()).toBe(true)
    expect(wrapper.find('.modal__close').exists()).toBe(true)
    expect(wrapper.find('.modal__body').exists()).toBe(true)
  })

  it('close button has correct content', () => {
    const wrapper = mount(AuthModal)
    
    const closeButton = wrapper.find('.modal__close')
    expect(closeButton.text()).toBe('×')
  })

  it('handles multiple close events correctly', async () => {
    const wrapper = mount(AuthModal)

    await wrapper.find('.modal__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('renders AuthForm in modal body', () => {
    const wrapper = mount(AuthModal)
    
    const modalBody = wrapper.find('.modal__body')
    const authForm = modalBody.findComponent(AuthForm)
    
    expect(authForm.exists()).toBe(true)
  })

  it('maintains proper event handling after multiple interactions', async () => {
    const wrapper = mount(AuthModal)
    
    const formData = { name: 'User', password: 'pass', confirmPassword: 'pass' }
    await wrapper.findComponent(AuthForm).vm.$emit('submit', formData)
    
    await wrapper.find('.modal__close').trigger('click')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual(formData)
  })
})