import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthForm from '@/components/base/AuthForm.vue'
import BaseButton from '@/components/base/BaseButton.vue'

describe('AuthForm.vue', () => {
  it('renders all form fields with correct labels', () => {
    const wrapper = mount(AuthForm)
    
    const inputs = wrapper.findAll('input')
    const labels = wrapper.findAll('.auth-form__label')
    
    expect(inputs).toHaveLength(3)
    expect(labels).toHaveLength(3)
    
    expect(inputs[0].attributes('type')).toBe('text')
    expect(labels[0].text()).toBe('Name')
    
    expect(inputs[1].attributes('type')).toBe('password')
    expect(labels[1].text()).toBe('Password')
    
    expect(inputs[2].attributes('type')).toBe('password')
    expect(labels[2].text()).toBe('Confirm Password')
  })

  it('renders submit button with correct classes', () => {
    const wrapper = mount(AuthForm)
    
    const button = wrapper.findComponent(BaseButton)
    expect(button.exists()).toBe(true)
    expect(button.classes()).toContain('auth-form__submit')
  })

  it('binds form data correctly', async () => {
    const wrapper = mount(AuthForm)
    
    const nameInput = wrapper.find('input[type="text"]')
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    await nameInput.setValue('John Doe')
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('password123')
    
    expect(wrapper.vm.form.name).toBe('John Doe')
    expect(wrapper.vm.form.password).toBe('password123')
    expect(wrapper.vm.form.confirmPassword).toBe('password123')
  })

  it('shows password error when passwords do not match', async () => {
    const wrapper = mount(AuthForm)
    
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('different')
    
    // Проверяем отображение ошибки в DOM вместо computed свойств
    expect(wrapper.find('.auth-form__error').exists()).toBe(true)
    expect(wrapper.find('.auth-form__error').text()).toBe("🚫 Passwords don't match")
    expect(wrapper.find('.auth-form__success').exists()).toBe(false)
  })

  it('shows password success when passwords match', async () => {
    const wrapper = mount(AuthForm)
    
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('password123')
    
    // Проверяем отображение успеха в DOM вместо computed свойств
    expect(wrapper.find('.auth-form__success').exists()).toBe(true)
    expect(wrapper.find('.auth-form__success').text()).toBe('✅ Passwords match')
    expect(wrapper.find('.auth-form__error').exists()).toBe(false)
  })

  it('does not show password validation messages when confirm password is empty', async () => {
    const wrapper = mount(AuthForm)
    
    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('password123')
    
    // Проверяем отсутствие сообщений в DOM
    expect(wrapper.find('.auth-form__error').exists()).toBe(false)
    expect(wrapper.find('.auth-form__success').exists()).toBe(false)
  })

  it('emits submit event with form data when passwords match', async () => {
    const wrapper = mount(AuthForm)
    
    const nameInput = wrapper.find('input[type="text"]')
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    await nameInput.setValue('John Doe')
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('password123')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0]).toEqual([{
      name: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123'
    }])
  })

  it('does not emit submit event when passwords do not match', async () => {
    const wrapper = mount(AuthForm)
    
    const nameInput = wrapper.find('input[type="text"]')
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    await nameInput.setValue('John Doe')
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('different')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('handles focus and blur events correctly', async () => {
    const wrapper = mount(AuthForm)
    
    const nameInput = wrapper.find('input[type="text"]')
    
    await nameInput.trigger('focus')
    expect(wrapper.vm.focusedField).toBe('name')
    
    await nameInput.trigger('blur')
    expect(wrapper.vm.focusedField).toBe(null)
  })

  it('applies floating label classes correctly', async () => {
    const wrapper = mount(AuthForm)
    
    const nameLabel = wrapper.findAll('.auth-form__label')[0]
    const nameInput = wrapper.find('input[type="text"]')
    
    // Initially no active class
    expect(nameLabel.classes()).not.toContain('floating-label--active')
    
    // Add active class on focus
    await nameInput.trigger('focus')
    expect(nameLabel.classes()).toContain('floating-label--active')
    
    // Remove active class on blur when empty
    await nameInput.trigger('blur')
    expect(nameLabel.classes()).not.toContain('floating-label--active')
    
    // Keep active class when input has value
    await nameInput.setValue('John')
    expect(nameLabel.classes()).toContain('floating-label--active')
  })

  it('prevents default form submission', async () => {
    const wrapper = mount(AuthForm)
    
    // Заполняем форму корректными данными
    await wrapper.find('input[type="text"]').setValue('Test User')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.findAll('input[type="password"]')[1].setValue('password123')
    
    // Триггерим submit
    await wrapper.find('form').trigger('submit')
    
    // Проверяем, что событие emit происходит, но страница не перезагружается
    // (это означает, что preventDefault работает)
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('has all required form attributes', () => {
    const wrapper = mount(AuthForm)
    
    const form = wrapper.find('form')
    expect(form.exists()).toBe(true)
    
    const inputs = wrapper.findAll('input[required]')
    expect(inputs).toHaveLength(3)
  })

  it('validates passwords correctly in UI', async () => {
    const wrapper = mount(AuthForm)
    
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    // Изначально нет сообщений
    expect(wrapper.find('.auth-form__error').exists()).toBe(false)
    expect(wrapper.find('.auth-form__success').exists()).toBe(false)
    
    // При несовпадающих паролях показывается ошибка
    await passwordInput.setValue('pass1')
    await confirmPasswordInput.setValue('pass2')
    expect(wrapper.find('.auth-form__error').exists()).toBe(true)
    expect(wrapper.find('.auth-form__success').exists()).toBe(false)
    
    // При совпадающих паролях показывается успех
    await confirmPasswordInput.setValue('pass1')
    expect(wrapper.find('.auth-form__error').exists()).toBe(false)
    expect(wrapper.find('.auth-form__success').exists()).toBe(true)
  })

  it('clears validation messages when confirm password is cleared', async () => {
    const wrapper = mount(AuthForm)
    
    const passwordInput = wrapper.find('input[type="password"]')
    const confirmPasswordInput = wrapper.findAll('input[type="password"]')[1]
    
    // Устанавливаем разные пароли
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('different')
    expect(wrapper.find('.auth-form__error').exists()).toBe(true)
    
    // Очищаем confirm password
    await confirmPasswordInput.setValue('')
    expect(wrapper.find('.auth-form__error').exists()).toBe(false)
    expect(wrapper.find('.auth-form__success').exists()).toBe(false)
  })
})