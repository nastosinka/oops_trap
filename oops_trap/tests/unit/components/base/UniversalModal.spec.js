import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UniversalModal from '@/components/base/UniversalModal.vue'
import UniversalForm from '@/components/base/UniversalForm.vue'
import RulesModal from '@/components/base/RulesModal.vue'
import StatsTable from '@/components/base/StatsTable.vue'
import SettingsModal from '@/components/base/SettingsModal.vue'

describe('UniversalModal', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(UniversalModal, {
      props: {
        title: 'Test Modal',
        type: 'auth',
        ...props
      },
      global: {
        components: {
          UniversalForm,
          RulesModal,
          StatsTable,
          SettingsModal
        }
      }
    })
  }

  describe('Initial Rendering', () => {
    it('renders modal with title and close button', () => {
      wrapper = createWrapper({ title: 'Test Title' })

      expect(wrapper.find('.modal__title').text()).toBe('Test Title')
      expect(wrapper.find('.modal__close').exists()).toBe(true)
      expect(wrapper.find('.modal__close').text()).toBe('×')
    })

    it('uses default title when not provided', () => {
      wrapper = createWrapper({ title: undefined })

      expect(wrapper.find('.modal__title').text()).toBe('Modal')
    })
  })

  describe('Modal Types', () => {
    it('renders UniversalForm for auth type', () => {
      wrapper = createWrapper({ type: 'auth' })

      expect(wrapper.findComponent(UniversalForm).exists()).toBe(true)
    })

    it('renders RulesModal for rules type', () => {
      wrapper = createWrapper({ type: 'rules' })

      expect(wrapper.findComponent(RulesModal).exists()).toBe(true)
    })

    it('renders StatsTable for stats type', () => {
      wrapper = createWrapper({ type: 'stats' })

      expect(wrapper.findComponent(StatsTable).exists()).toBe(true)
    })

    it('renders SettingsModal for settings type', () => {
      wrapper = createWrapper({ type: 'settings' })

      expect(wrapper.findComponent(SettingsModal).exists()).toBe(true)
    })

    it('renders slot content for custom type', () => {
      wrapper = mount(UniversalModal, {
        props: {
          type: 'custom',
          content: 'Custom content'
        },
        global: {
          components: {
            UniversalForm,
            RulesModal,
            StatsTable,
            SettingsModal
          }
        }
      })

      expect(wrapper.text()).toContain('Custom content')
    })

    it('renders default slot when no content provided', () => {
      wrapper = mount(UniversalModal, {
        props: {
          type: 'custom',
          title: ''
        },
        slots: {
          default: ''
        },
        global: {
          components: {
            UniversalForm,
            RulesModal,
            StatsTable,
            SettingsModal
          }
        }
      })

      expect(wrapper.text()).toBe('×')
    })
  })

  describe('Props Passing', () => {
    it('passes correct props to UniversalForm', () => {
      const formProps = {
        fields: ['name', 'password'],
        submitText: 'Login',
        initialData: { name: 'test' }
      }

      wrapper = createWrapper({
        type: 'auth',
        ...formProps
      })

      const form = wrapper.findComponent(UniversalForm)
      expect(form.props('fields')).toEqual(['name', 'password'])
      expect(form.props('submitText')).toBe('Login')
      expect(form.props('initialData')).toEqual({ name: 'test' })
    })

    it('passes correct props to RulesModal', () => {
      wrapper = createWrapper({
        type: 'rules',
        initialSection: 'trapmaker'
      })

      const rulesModal = wrapper.findComponent(RulesModal)
      expect(rulesModal.props('initialSection')).toBe('trapmaker')
    })

    it('passes correct props to StatsTable', () => {
      const statsData = [{ map: 'Test', role: 'runner', time: '1:00' }]

      wrapper = createWrapper({
        type: 'stats',
        statsData
      })

      const statsTable = wrapper.findComponent(StatsTable)
      expect(statsTable.props('data')).toEqual(statsData)
    })

    it('passes correct props to SettingsModal', () => {
      const players = [{ id: 1, name: 'Player1' }]
      const initialSettings = { map: 'city' }

      wrapper = createWrapper({
        type: 'settings',
        players,
        initialSettings
      })

      const settingsModal = wrapper.findComponent(SettingsModal)
      expect(settingsModal.props('players')).toEqual(players)
      expect(settingsModal.props('initialSettings')).toEqual(initialSettings)
    })
  })

  describe('Event Handling', () => {
    it('emits close event when close button is clicked', async () => {
      wrapper = createWrapper()

      await wrapper.find('.modal__close').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close event when overlay is clicked', async () => {
      wrapper = createWrapper()

      await wrapper.find('.modal-overlay').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not emit close when modal content is clicked', async () => {
      wrapper = createWrapper()

      await wrapper.find('.modal').trigger('click')

      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it('emits submit event when auth form is submitted', async () => {
      wrapper = createWrapper({ type: 'auth' })

      const formData = { name: 'test', password: '123' }
      await wrapper.findComponent(UniversalForm).vm.$emit('submit', formData)

      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')[0][0]).toEqual(formData)
    })

    it('emits settings-apply event and closes when settings are applied', async () => {
      wrapper = createWrapper({ type: 'settings' })

      const settings = { map: 'city', time: 'normal' }
      await wrapper.findComponent(SettingsModal).vm.$emit('apply', settings)

      expect(wrapper.emitted('settings-apply')).toHaveLength(1)
      expect(wrapper.emitted('settings-apply')[0][0]).toEqual(settings)
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  describe('CSS Classes', () => {
    it('applies modal--rules class for rules type', () => {
      wrapper = createWrapper({ type: 'rules' })

      expect(wrapper.find('.modal').classes()).toContain('modal--rules')
    })

    it('applies modal--stats class for stats type', () => {
      wrapper = createWrapper({ type: 'stats' })

      expect(wrapper.find('.modal').classes()).toContain('modal--stats')
    })

    it('does not apply special classes for auth type', () => {
      wrapper = createWrapper({ type: 'auth' })

      const modal = wrapper.find('.modal')
      expect(modal.classes()).not.toContain('modal--rules')
      expect(modal.classes()).not.toContain('modal--stats')
    })

    it('does not apply special classes for settings type', () => {
      wrapper = createWrapper({ type: 'settings' })

      const modal = wrapper.find('.modal')
      expect(modal.classes()).not.toContain('modal--rules')
      expect(modal.classes()).not.toContain('modal--stats')
    })
  })

  describe('Default Props', () => {
    it('uses default fields for auth type', () => {
      wrapper = createWrapper({ type: 'auth' })

      const form = wrapper.findComponent(UniversalForm)
      expect(form.props('fields')).toEqual([
        'name',
        'password',
        'confirmPassword'
      ])
    })

    it('uses default submitText for auth type', () => {
      wrapper = createWrapper({ type: 'auth' })

      const form = wrapper.findComponent(UniversalForm)
      expect(form.props('submitText')).toBe('Sign Up')
    })

    it('uses default initialSection for rules type', () => {
      wrapper = createWrapper({ type: 'rules' })

      const rulesModal = wrapper.findComponent(RulesModal)
      expect(rulesModal.props('initialSection')).toBe('common')
    })

    it('uses default empty arrays for stats and players', () => {
      wrapper = createWrapper({ type: 'stats' })

      const statsTable = wrapper.findComponent(StatsTable)
      expect(statsTable.props('data')).toEqual([])
    })
  })
})
