import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UniversalForm from '@/components/base/UniversalForm.vue'
import BaseButton from '@/components/base/BaseButton.vue'

vi.mock('@/utils/notification-wrapper', () => ({
  showError: vi.fn()
}))

describe('UniversalForm', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(UniversalForm, {
      props: {
        fields: ['name', 'password', 'confirmPassword'],
        submitText: 'Sign Up',
        initialData: {},
        ...props
      },
      global: {
        components: {
          BaseButton
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders form with default fields', () => {
      wrapper = createWrapper()

      const inputs = wrapper.findAll('input')
      expect(inputs).toHaveLength(3)

      const labels = wrapper.findAll('.auth-form__label')
      expect(labels[0].text()).toBe('Name')
      expect(labels[1].text()).toBe('Password')
      expect(labels[2].text()).toBe('Confirm Password')
    })

    it('renders only visible fields based on props', () => {
      wrapper = createWrapper({ fields: ['name', 'lobbyCode'] })

      const inputs = wrapper.findAll('input')
      expect(inputs).toHaveLength(2)

      const labels = wrapper.findAll('.auth-form__label')
      expect(labels[0].text()).toBe('Name')
      expect(labels[1].text()).toBe('Lobby Code')
    })

    it('renders submit button with correct text', () => {
      wrapper = createWrapper({ submitText: 'Custom Submit' })

      const button = wrapper.findComponent(BaseButton)
      expect(button.text()).toBe('Custom Submit')
    })
  })

  describe('Form Validation', () => {
    describe('Password Confirmation', () => {
      it('shows error when passwords do not match', async () => {
        wrapper = createWrapper()

        await wrapper.find('input[type="password"]').setValue('password123')
        await wrapper.findAll('input[type="password"]')[1].setValue('different')

        expect(wrapper.vm.showPasswordError).toBe(true)
        expect(wrapper.find('.auth-form__error').exists()).toBe(true)
        expect(wrapper.find('.auth-form__error').text()).toBe(
          "🚫 Passwords don't match"
        )
      })

      it('shows success when passwords match', async () => {
        wrapper = createWrapper()

        await wrapper.find('input[type="password"]').setValue('password123')
        await wrapper
          .findAll('input[type="password"]')[1]
          .setValue('password123')

        expect(wrapper.vm.showPasswordSuccess).toBe(true)
        expect(wrapper.find('.auth-form__success').exists()).toBe(true)
        expect(wrapper.find('.auth-form__success').text()).toBe(
          '✅ Passwords match'
        )
      })

      it('hides messages when confirm password is empty', async () => {
        wrapper = createWrapper()

        await wrapper.find('input[type="password"]').setValue('password123')

        expect(wrapper.vm.showPasswordError).toBeFalsy()
        expect(wrapper.vm.showPasswordSuccess).toBeFalsy()
        expect(wrapper.find('.auth-form__error').exists()).toBe(false)
        expect(wrapper.find('.auth-form__success').exists()).toBe(false)
      })
    })

    describe('Form Validity', () => {
      it('is valid when all required fields are filled and passwords match', async () => {
        wrapper = createWrapper()

        await wrapper.find('input[type="text"]').setValue('testuser')
        await wrapper.find('input[type="password"]').setValue('password123')
        await wrapper
          .findAll('input[type="password"]')[1]
          .setValue('password123')

        expect(wrapper.vm.isFormValid).toBe(true)
      })

      it('is invalid when passwords do not match', async () => {
        wrapper = createWrapper()

        await wrapper.find('input[type="text"]').setValue('testuser')
        await wrapper.find('input[type="password"]').setValue('password123')
        await wrapper.findAll('input[type="password"]')[1].setValue('different')

        expect(wrapper.vm.isFormValid).toBe(false)
      })

      it('is invalid when lobby code is empty', () => {
        wrapper = createWrapper({ fields: ['lobbyCode'] })

        expect(wrapper.vm.isFormValid).toBe(false)
      })

      it('is valid when lobby code is provided', async () => {
        wrapper = createWrapper({ fields: ['lobbyCode'] })

        await wrapper.find('input[type="text"]').setValue('ABC123')

        expect(wrapper.vm.isFormValid).toBe(true)
      })
    })
  })

  describe('Input Handling', () => {
    it('converts lobby code to uppercase on input', async () => {
      wrapper = createWrapper({ fields: ['lobbyCode'] })

      const lobbyCodeInput = wrapper.find('input[type="text"]')
      await lobbyCodeInput.setValue('abc123')

      expect(wrapper.vm.form.lobbyCode).toBe('ABC123')
    })

    it('sets correct input types for password fields', () => {
      wrapper = createWrapper()

      const inputs = wrapper.findAll('input')
      expect(inputs[0].attributes('type')).toBe('text')
      expect(inputs[1].attributes('type')).toBe('password')
      expect(inputs[2].attributes('type')).toBe('password')
    })

    it('handles focus and blur events', async () => {
      wrapper = createWrapper()

      const nameInput = wrapper.find('input[type="text"]')
      await nameInput.trigger('focus')

      expect(wrapper.vm.focusedField).toBe('name')

      await nameInput.trigger('blur')

      expect(wrapper.vm.focusedField).toBeNull()
    })

    it('applies floating label active class when field has value or is focused', async () => {
      wrapper = createWrapper()

      const nameInput = wrapper.find('input[type="text"]')
      const nameLabel = wrapper.findAll('.auth-form__label')[0]

      expect(nameLabel.classes()).not.toContain('floating-label--active')

      await nameInput.trigger('focus')
      expect(nameLabel.classes()).toContain('floating-label--active')

      await nameInput.setValue('test')
      await nameInput.trigger('blur')
      expect(nameLabel.classes()).toContain('floating-label--active')
    })
  })

  describe('Form Submission', () => {
    it('emits submit event with form data when form is valid', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[type="text"]').setValue('testuser')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.findAll('input[type="password"]')[1].setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')[0][0]).toEqual({
        name: 'testuser',
        password: 'password123',
        confirmPassword: 'password123',
        lobbyCode: ''
      })
    })

    it('does not emit submit event when form is invalid', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[type="text"]').setValue('testuser')
      await wrapper.find('input[type="password"]').setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.vm.isFormValid).toBe(false)
      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('shows error for empty lobby code', async () => {
      wrapper = createWrapper({ fields: ['lobbyCode'] })

      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.vm.isFormValid).toBe(false)
      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('shows error for mismatched passwords', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[type="text"]').setValue('testuser')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.findAll('input[type="password"]')[1].setValue('different')

      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.vm.isFormValid).toBe(false)
      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('Initial Data', () => {
    it('initializes form with initialData prop', () => {
      wrapper = createWrapper({
        initialData: {
          name: 'prefilled',
          password: 'secret'
        }
      })

      expect(wrapper.vm.form.name).toBe('prefilled')
      expect(wrapper.vm.form.password).toBe('secret')
    })

    it('merges initialData with default form structure', () => {
      wrapper = createWrapper({
        initialData: {
          name: 'prefilled'
        }
      })

      expect(wrapper.vm.form.name).toBe('prefilled')
      expect(wrapper.vm.form.password).toBe('')
      expect(wrapper.vm.form.confirmPassword).toBe('')
      expect(wrapper.vm.form.lobbyCode).toBe('')
    })
  })

  describe('Button State', () => {
    it('disables button when form is invalid', async () => {
      wrapper = createWrapper()

      await wrapper.setData({
        form: {
          name: 'testuser',
          password: 'password123',
          confirmPassword: 'differentpassword',
          lobbyCode: ''
        }
      })

      expect(wrapper.vm.isFormValid).toBe(false)

      const button = wrapper.findComponent(BaseButton)
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('enables button when form is valid', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[type="text"]').setValue('testuser')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.findAll('input[type="password"]')[1].setValue('password123')

      expect(wrapper.vm.isFormValid).toBe(true)

      const button = wrapper.findComponent(BaseButton)
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })
})
