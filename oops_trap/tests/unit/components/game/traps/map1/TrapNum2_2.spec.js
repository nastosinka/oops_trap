import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TrapImage from '@/components/game/traps/map1/TrapNum2_2.vue'

describe('TrapImage.vue', () => {
  it('рендерит компонент', () => {
    const wrapper = mount(TrapImage, {
      props: {
        type: 'fire',
        active: false
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('содержит класс "trap-image"', () => {
    const wrapper = mount(TrapImage, {
      props: { type: 'fire', active: false }
    })
    expect(wrapper.classes()).toContain('trap-image')
  })

  it('не имеет класса "active" если active=false', () => {
    const wrapper = mount(TrapImage, {
      props: { type: 'fire', active: false }
    })
    expect(wrapper.classes()).not.toContain('active')
  })

  it('имеет класс "active" если active=true', () => {
    const wrapper = mount(TrapImage, { props: { type: 'fire', active: true } })
    expect(wrapper.classes()).toContain('active')
  })

  it('реагирует на изменение prop active', async () => {
    const wrapper = mount(TrapImage, {
      props: { type: 'fire', active: false }
    })
    expect(wrapper.classes()).not.toContain('active')

    await wrapper.setProps({ active: true })
    expect(wrapper.classes()).toContain('active')
  })

  it('принимает prop type', () => {
    const wrapper = mount(TrapImage, { props: { type: 'ice', active: false } })
    expect(wrapper.props('type')).toBe('ice')
  })
})
