import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton.vue', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseButton)
    
    expect(wrapper.classes()).toContain('base-button')
    expect(wrapper.classes()).toContain('base-button--medium')
    expect(wrapper.find('.base-button__content').exists()).toBe(true)
  })

  it('renders with different sizes', () => {
    const sizes = ['small', 'medium', 'large']
    
    sizes.forEach(size => {
      const wrapper = mount(BaseButton, {
        props: { size }
      })
      
      expect(wrapper.classes()).toContain(`base-button--${size}`)
    })
  })

  it('renders label from prop when no slot', () => {
    const label = 'Test Button'
    const wrapper = mount(BaseButton, {
      props: { label }
    })
    
    expect(wrapper.text()).toBe(label)
  })

  it('renders slot content instead of label', () => {
    const wrapper = mount(BaseButton, {
      props: { label: 'Prop Label' },
      slots: { default: 'Slot Content' }
    })
    
    expect(wrapper.text()).toBe('Slot Content')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('calls handleClick method and emits event', async () => {
    const wrapper = mount(BaseButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0]).toBeInstanceOf(Array)
  })

  it('validates size prop', () => {
    const validator = BaseButton.props.size.validator
    
    expect(validator('small')).toBe(true)
    expect(validator('medium')).toBe(true)
    expect(validator('large')).toBe(true)
    expect(validator('invalid')).toBe(false)
  })
})