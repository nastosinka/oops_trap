// GameScreen.spec.js
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import GameScreen from '@/components/game/maps/MapOfGame.vue';
import CurrentPlayer from '@/components/game/player/general/CurrentPlayer.vue';

// Мокаем все зависимости
const useUserStore = vi.fn();

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => ({
        isAlive: true,
        myRole: 'innocent',
        gameMap: 1,
    }))
}));

vi.mock('@/components/game/traps/registry', () => ({
    TRAPS_BY_MAP: {
        map1: [
            { id: 'trap1', name: 'spikes', component: 'TrapSpikes' },
            { id: 'trap2', name: 'fire', component: 'TrapFire' },
        ],
        map2: [
            { id: 'trap3', name: 'arrows', component: 'TrapArrows' },
        ]
    }
}));

vi.mock('@/components/game/traps/TrapController.vue', () => ({
    default: {
        template: '<div class="mock-trap-controller"></div>',
        props: ['traps'],
        emits: ['activate']
    }
}));

vi.mock('@/components/game/player/general/CurrentPlayer.vue', () => ({
    default: {
        name: 'CurrentPlayer',
        template: '<div class="mock-current-player"></div>',
        props: ['gameArea', 'polygons'],
        emits: ['playerMove']
    }
}));

vi.mock('@/components/game/player/general/OtherPlayer.vue', () => ({
    default: {
        template: '<div class="mock-other-players"></div>',
        props: ['players']
    }
}));

vi.mock('@/components/game/maps/background/FirstMapBackground.vue', () => ({
    default: {
        template: '<div class="mock-map-1">Map 1</div>'
    }
}));

vi.mock('@/components/game/maps/background/SecondMapBackground.vue', () => ({
    default: {
        template: '<div class="mock-map-2">Map 2</div>'
    }
}));

// Мокаем глобальные объекты
const mockDispatchEvent = vi.fn();
const mockFetch = vi.fn();

beforeAll(() => {
    global.window = {
        ...global.window,
        innerWidth: 1920,
        innerHeight: 1080,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: mockDispatchEvent,
        fetch: mockFetch,
    };

    global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));
});

afterAll(() => {
    vi.restoreAllMocks();
});

describe('GameScreen Component', () => {
    let wrapper;
    let userStoreMock;

    beforeEach(() => {
        // Сбрасываем все моки
        vi.clearAllMocks();

        // Создаем Pinia store
        setActivePinia(createPinia());

        // Мокаем user store
        userStoreMock = {
            isAlive: true,
            myRole: 'innocent',
            gameMap: 1,
        };

        vi.mocked(useUserStore).mockReturnValue(userStoreMock);

        // Мокаем успешный fetch для полигонов
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ polygons: [{ id: 1, points: [0, 0, 100, 0, 100, 100] }] })
        });

        // Создаем компонент
        wrapper = mount(GameScreen, {
            props: {
                otherPlayers: [
                    { id: 'player1', name: 'Player 1', x: 100, y: 100 },
                    { id: 'player2', name: 'Player 2', x: 200, y: 200 },
                ]
            },
            global: {
                stubs: {
                    // Стабим все компоненты для изоляции
                    TrapController: true,
                    CurrentPlayer: true,
                    OtherPlayers: true,
                    FirstMapBackground: true,
                    SecondMapBackground: true,
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe('Рендеринг и структура', () => {
        it('должен рендерить основной контейнер game-screen', () => {
            expect(wrapper.find('.game-screen').exists()).toBe(true);
        });

        it('должен рендерить контейнер game-content', () => {
            expect(wrapper.find('.game-content').exists()).toBe(true);
        });

        it('должен рендерить trap-controller-wrapper', () => {
            expect(wrapper.find('.trap-controller-wrapper').exists()).toBe(true);
        });
    });

    describe('Рендеринг компонентов в зависимости от роли', () => {
        it('должен рендерить CurrentPlayer для не-мафии и живого игрока', () => {
            userStoreMock.myRole = 'innocent';
            userStoreMock.isAlive = true;

            wrapper = mount(GameScreen, {
                global: {
                    stubs: {
                        CurrentPlayer: {
                            template: '<div class="current-player"></div>'
                        }
                    }
                }
            });

            expect(wrapper.findComponent(CurrentPlayer).exists()).toBe(true);
        });

        it('НЕ должен рендерить CurrentPlayer для мафии', async () => {
            userStoreMock.myRole = 'mafia';
            userStoreMock.isAlive = true;

            wrapper = mount(GameScreen, {
                global: {
                    stubs: {
                        CurrentPlayer: {
                            template: '<div class="current-player"></div>'
                        }
                    }
                }
            });

            await nextTick();
            expect(wrapper.findComponent({ name: 'CurrentPlayer' }).exists()).toBe(false);
        });

        it('НЕ должен рендерить CurrentPlayer для мертвого игрока', async () => {
            userStoreMock.myRole = 'innocent';
            userStoreMock.isAlive = false;

            wrapper = mount(GameScreen, {
                global: {
                    stubs: {
                        CurrentPlayer: {
                            template: '<div class="current-player"></div>'
                        }
                    }
                }
            });

            await nextTick();
            expect(wrapper.findComponent({ name: 'CurrentPlayer' }).exists()).toBe(false);
        });

        it('НЕ должен рендерить TrapController для не-мафии', () => {
            userStoreMock.myRole = 'innocent';

            wrapper = mount(GameScreen, {
                global: {
                    stubs: {
                        TrapController: {
                            template: '<div class="trap-controller"></div>'
                        }
                    }
                }
            });

            expect(wrapper.findComponent({ name: 'TrapController' }).exists()).toBe(false);
        });
    });

    describe('Рендеринг ловушек', () => {
        it('должен рендерить ловушки для текущей карты', () => {
            // Для map1 должно быть 2 ловушки
            userStoreMock.gameMap = 1;

            wrapper = mount(GameScreen, {
                global: {
                    stubs: {
                        TrapSpikes: { template: '<div class="trap-spikes"></div>' },
                        TrapFire: { template: '<div class="trap-fire"></div>' },
                    }
                }
            });

            // Не можем проверить напрямую, так как компоненты динамические
            // Но можем проверить что traps computed работает
            expect(wrapper.vm.traps).toHaveLength(2);
        });

        it('должен инициализировать состояние ловушек', () => {
            expect(wrapper.vm.trapsState).toEqual({
                spikes: false,
                fire: false
            });
        });
    });

    describe('Логика ловушек', () => {
        it('должен активировать ловушку при вызове onTrapActivate', async () => {
            const trap = { name: 'spikes' };

            wrapper.vm.onTrapActivate(trap);
            await nextTick();

            expect(wrapper.vm.trapsState.spikes).toBe(true);
        });

        it('должен диспатчить событие при активации ловушки', async () => {
            const trap = { name: 'fire' };

            wrapper.vm.onTrapActivate(trap);
            await nextTick();

            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'player-traps-update',
                    detail: 'fire'
                })
            );
        });

        it('должен деактивировать ловушку при вызове onTrapDisactive', async () => {
            // Сначала активируем
            const trap = { name: 'spikes' };
            wrapper.vm.onTrapActivate(trap);
            await nextTick();
            expect(wrapper.vm.trapsState.spikes).toBe(true);

            // Затем деактивируем
            wrapper.vm.onTrapDisactive(trap);
            await nextTick();
            expect(wrapper.vm.trapsState.spikes).toBe(false);
        });
    });

    describe('Props обработка', () => {
        it('должен активировать ловушку при получении trapToActivate', async () => {
            const trap = { name: 'fire' };

            await wrapper.setProps({ trapToActivate: trap });

            expect(wrapper.vm.trapsState.fire).toBe(true);
        });

        it('должен деактивировать ловушку при получении trapToDeactivate', async () => {
            // Сначала активируем
            const trap = { name: 'fire' };
            wrapper.vm.onTrapActivate(trap);
            await nextTick();
            expect(wrapper.vm.trapsState.fire).toBe(true);

            // Затем деактивируем через проп
            await wrapper.setProps({ trapToDeactivate: trap });
            expect(wrapper.vm.trapsState.fire).toBe(false);
        });
    });

    describe('Игровая область (gameArea)', () => {
        it('должен предоставлять gameArea через provide', () => {
            // gameArea должен быть реактивным объектом с базовыми значениями
            expect(wrapper.vm.gameArea).toEqual({
                width: 1920,
                height: 1080,
                scale: 1,
                baseWidth: 1920,
                baseHeight: 1080,
                marginTop: 0,
                marginLeft: 0,
            });
        });
    });

    describe('Обработка движения игрока', () => {
        it('должен диспатчить событие при движении игрока', () => {
            const coords = { x: 100, y: 200 };

            wrapper.vm.handlePlayerMove(coords);

            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'player-coords-update',
                    detail: coords
                })
            );
        });
    });

    describe('Polygons загрузка', () => {
        it('должен обрабатывать ошибку загрузки полигонов', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            wrapper = mount(GameScreen);
            await flushPromises();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Polygon load error', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Ресайз экрана', () => {
        it('должен добавлять обработчик resize при монтировании', () => {
            expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        });

        it('должен удалять обработчик resize при размонтировании', () => {
            wrapper.unmount();
            expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });

    describe('Exposed методы', () => {
        it('должен экспортировать методы управления ловушками', () => {
            expect(wrapper.vm.onTrapActivate).toBeDefined();
            expect(wrapper.vm.onTrapDisactive).toBeDefined();
            expect(typeof wrapper.vm.onTrapActivate).toBe('function');
            expect(typeof wrapper.vm.onTrapDisactive).toBe('function');
        });
    });

    describe('Lifecycle', () => {
        it('должен вызывать updateScreenSize при монтировании', () => {
            // Проверяем что стили установлены
            const gameContent = wrapper.find('.game-content');
            expect(gameContent.attributes('style')).toContain('width: 1920px');
            expect(gameContent.attributes('style')).toContain('height: 1080px');
        });
    });
});