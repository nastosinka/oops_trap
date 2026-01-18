import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TrapController from '@/components/game/traps/TrapController.vue';
import BaseButton from '@/components/base/BaseButton.vue';

// Мокаем setTimeout для контроля таймеров
vi.useFakeTimers();

describe('TrapController', () => {
  const mockTraps = [
    { id: 1, name: 'Fire Trap' },
    { id: 2, name: 'Ice Trap' },
    { id: 3, name: 'Shock Trap' },
  ];

  let wrapper;

  beforeEach(() => {
    wrapper = mount(TrapController, {
      props: {
        traps: mockTraps,
      },
      global: {
        components: {
          BaseButton,
        },
      },
    });
  });

  it('отображает правильное количество кнопок', () => {
    const buttons = wrapper.findAllComponents(BaseButton);
    expect(buttons).toHaveLength(mockTraps.length);
  });

  it('отображает правильные названия ловушек на кнопках', () => {
    const buttons = wrapper.findAllComponents(BaseButton);
    
    buttons.forEach((button, index) => {
      expect(button.text()).toBe(mockTraps[index].name);
    });
  });

  it('отправляет событие activate при клике на кнопку', async () => {
    const firstButton = wrapper.findAllComponents(BaseButton)[0];
    
    await firstButton.trigger('click');
    
    expect(wrapper.emitted('activate')).toBeTruthy();
    expect(wrapper.emitted('activate')[0]).toEqual([mockTraps[0]]);
  });

  it('блокирует кнопку после активации на 20 секунд', async () => {
    const firstButton = wrapper.findAllComponents(BaseButton)[0];
    
    // Первый клик должен работать
    await firstButton.trigger('click');
    expect(firstButton.attributes('disabled')).toBe('');
    
    // Второй клик не должен срабатывать
    await firstButton.trigger('click');
    expect(wrapper.emitted('activate')).toHaveLength(1);
  });

  it('не блокирует другие кнопки при активации одной ловушки', async () => {
    const buttons = wrapper.findAllComponents(BaseButton);
    
    // Активируем первую ловушку
    await buttons[0].trigger('click');
    
    // Первая кнопка должна быть заблокирована
    expect(buttons[0].attributes('disabled')).toBe('');
    
    // Вторая кнопка должна быть активна
    expect(buttons[1].attributes('disabled')).toBeUndefined();
    
    // Можем активировать вторую ловушку
    await buttons[1].trigger('click');
    expect(wrapper.emitted('activate')).toHaveLength(2);
  });

  it('обрабатывает пустой массив ловушек', () => {
    const emptyWrapper = mount(TrapController, {
      props: {
        traps: [],
      },
      global: {
        components: {
          BaseButton,
        },
      },
    });
    
    const buttons = emptyWrapper.findAllComponents(BaseButton);
    expect(buttons).toHaveLength(0);
  });

  it('инициализирует cooldowns как реактивный объект', () => {
    expect(wrapper.vm.cooldowns).toBeDefined();
    expect(typeof wrapper.vm.cooldowns).toBe('object');
  });

  it('корректно обрабатывает клик по заблокированной кнопке', async () => {
    const firstButton = wrapper.findAllComponents(BaseButton)[0];
    
    // Активируем ловушку
    await firstButton.trigger('click');
    
    // Сохраняем текущее количество событий
    const initialEmitCount = wrapper.emitted('activate')?.length || 0;
    
    // Пытаемся кликнуть снова (кнопка заблокирована)
    await firstButton.trigger('click');
    
    // Количество событий не должно измениться
    expect(wrapper.emitted('activate')?.length || 0).toBe(initialEmitCount);
  });
});