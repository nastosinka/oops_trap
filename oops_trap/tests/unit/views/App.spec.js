import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import App from '@/App.vue'

vi.mock('@sentry/vue', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn()
}))

describe('App.vue', () => {
  it('renders without errors', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: '<div>Test Content</div>'
          }
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('contains router view', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: '<div>Router View Content</div>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Router View Content')
  })
})
