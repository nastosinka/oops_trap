import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import SettingsModal from '@/components/base/SettingsModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

describe('SettingsModal.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' }
  ]

  const defaultInitialSettings = {
    map: 1,
    mafia: 2,
    time: 'normal'
  }

  const createWrapper = (props = {}) => {
    return mount(SettingsModal, {
      props: {
        players: props.players || mockPlayers,
        initialSettings: props.initialSettings || {}
      },
      global: {
        components: {
          BaseButton
        }
      }
    })
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Рендеринг компонента', () => {
    it('должен отображать все секции настроек', () => {
      wrapper = createWrapper()

      const settingGroups = wrapper.findAll('.setting-group')
      expect(settingGroups).toHaveLength(3)

      const titles = wrapper.findAll('.setting-title')
      expect(titles[0].text()).toBe('map type')
      expect(titles[1].text()).toBe('mafia')
      expect(titles[2].text()).toBe('time')
    })

    it('должен отображать кнопку Apply', () => {
      wrapper = createWrapper()

      const button = wrapper.findComponent(BaseButton)
      expect(button.exists()).toBe(true)
      expect(button.props('label')).toBe('Apply')
    })
  })

  describe('Селект карты', () => {
    it('должен отображать опции карт', () => {
      wrapper = createWrapper()

      const mapSelect = wrapper.findAll('select')[0]
      const options = mapSelect.findAll('option')

      expect(options).toHaveLength(3)
      expect(options[0].text()).toBe('select map type')
      expect(options[1].text()).toBe('city')
      expect(options[2].text()).toBe('village')
      expect(options[1].attributes('value')).toBe('1')
      expect(options[2].attributes('value')).toBe('2')
    })

    it('должен устанавливать начальное значение карты из initialSettings', () => {
      wrapper = createWrapper({
        initialSettings: { map: 2 }
      })

      expect(wrapper.vm.selectedMap).toBe(2)
    })
  })

  describe('Селект мафии', () => {
    it('должен отображать опции игроков', () => {
      wrapper = createWrapper()

      const mafiaSelect = wrapper.findAll('select')[1]
      const options = mafiaSelect.findAll('option')

      expect(options).toHaveLength(4)
      expect(options[0].text()).toBe('select mafia')
      expect(options[1].text()).toBe('Player 1')
      expect(options[2].text()).toBe('Player 2')
      expect(options[3].text()).toBe('Player 3')
      expect(options[1].attributes('value')).toBe('1')
      expect(options[2].attributes('value')).toBe('2')
      expect(options[3].attributes('value')).toBe('3')
    })

    it('должен устанавливать начальное значение мафии из initialSettings', () => {
      wrapper = createWrapper({
        initialSettings: { mafia: 3 }
      })

      expect(wrapper.vm.selectedMafia).toBe(3)
    })

    it('должен работать с пустым массивом игроков', () => {
      wrapper = createWrapper({
        players: []
      })

      const mafiaSelect = wrapper.findAll('select')[1]
      const options = mafiaSelect.findAll('option')

      expect(options).toHaveLength(1)
      expect(options[0].text()).toBe('select mafia')
    })
  })

  describe('Селект времени', () => {
    it('должен отображать опции времени', () => {
      wrapper = createWrapper()

      const timeSelect = wrapper.findAll('select')[2]
      const options = timeSelect.findAll('option')

      expect(options).toHaveLength(4)
      expect(options[0].text()).toBe('select time')
      expect(options[1].text()).toBe('easy')
      expect(options[2].text()).toBe('normal')
      expect(options[3].text()).toBe('hard')
      expect(options[1].attributes('value')).toBe('easy')
      expect(options[2].attributes('value')).toBe('normal')
      expect(options[3].attributes('value')).toBe('hard')
    })

    it('должен устанавливать начальное значение времени из initialSettings', () => {
      wrapper = createWrapper({
        initialSettings: { time: 'hard' }
      })

      expect(wrapper.vm.selectedTime).toBe('hard')
    })
  })

  describe('Инициализация данных', () => {
    it('должен инициализировать пустые значения при отсутствии initialSettings', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.selectedMap).toBe('')
      expect(wrapper.vm.selectedMafia).toBe('')
      expect(wrapper.vm.selectedTime).toBe('')
    })

    it('должен инициализировать значения из partial initialSettings', () => {
      wrapper = createWrapper({
        initialSettings: {
          map: 1,
          time: 'easy'
        }
      })

      expect(wrapper.vm.selectedMap).toBe(1)
      expect(wrapper.vm.selectedMafia).toBe('')
      expect(wrapper.vm.selectedTime).toBe('easy')
    })

    it('должен инициализировать все значения из полного initialSettings', () => {
      wrapper = createWrapper({
        initialSettings: defaultInitialSettings
      })

      expect(wrapper.vm.selectedMap).toBe(1)
      expect(wrapper.vm.selectedMafia).toBe(2)
      expect(wrapper.vm.selectedTime).toBe('normal')
    })
  })

  describe('Метод handleApply', () => {
    it('должен эмитить событие apply с текущими настройками', async () => {
      wrapper = createWrapper({
        initialSettings: defaultInitialSettings
      })

      await wrapper.vm.handleApply()

      expect(wrapper.emitted('apply')).toHaveLength(1)
      expect(wrapper.emitted('apply')[0]).toEqual([defaultInitialSettings])
    })

    it('должен эмитить событие apply с частичными настройками', async () => {
      wrapper = createWrapper({
        initialSettings: { map: 2 }
      })

      await wrapper.vm.handleApply()

      expect(wrapper.emitted('apply')).toHaveLength(1)
      expect(wrapper.emitted('apply')[0]).toEqual([
        {
          map: 2,
          mafia: '',
          time: ''
        }
      ])
    })

    it('должен эмитить событие apply при клике на кнопку', async () => {
      wrapper = createWrapper({
        initialSettings: defaultInitialSettings
      })

      const button = wrapper.findComponent(BaseButton)
      await button.trigger('click')

      expect(wrapper.emitted('apply')).toHaveLength(1)
      expect(wrapper.emitted('apply')[0]).toEqual([defaultInitialSettings])
    })
  })

  describe('Двустороннее связывание (v-model)', () => {
    it('должен обновлять selectedMap при изменении селекта карты', async () => {
      wrapper = createWrapper()

      const mapSelect = wrapper.findAll('select')[0]
      await mapSelect.setValue('2')

      expect(wrapper.vm.selectedMap).toBe(2)
    })

    it('должен обновлять selectedMafia при изменении селекта мафии', async () => {
      wrapper = createWrapper()

      const mafiaSelect = wrapper.findAll('select')[1]
      await mafiaSelect.setValue('2')

      expect(wrapper.vm.selectedMafia).toBe(2)
    })

    it('должен обновлять selectedTime при изменении селекта времени', async () => {
      wrapper = createWrapper()

      const timeSelect = wrapper.findAll('select')[2]
      await timeSelect.setValue('hard')

      expect(wrapper.vm.selectedTime).toBe('hard')
    })
  })

  describe('Валидация пропсов', () => {
    it('должен работать с пустым массивом players по умолчанию', () => {
      wrapper = mount(SettingsModal, {
        props: {},
        global: {
          components: {
            BaseButton
          }
        }
      })

      expect(wrapper.vm.players).toEqual([])
    })

    it('должен работать с пустым объектом initialSettings по умолчанию', () => {
      wrapper = mount(SettingsModal, {
        props: {},
        global: {
          components: {
            BaseButton
          }
        }
      })

      expect(wrapper.vm.initialSettings).toEqual({})
    })
  })
})
