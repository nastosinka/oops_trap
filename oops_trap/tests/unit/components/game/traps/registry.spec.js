import { describe, it, expect } from 'vitest'
import { TRAPS_BY_MAP } from '@/components/game/traps/registry.js' 

// Мокаем импорты компонентов, чтобы тесты не зависели от реальных Vue компонентов
vi.mock('@/components/game/traps/map2/TrapNum1.vue', () => ({ default: 'TrapNum1_2' }))
vi.mock('@/components/game/traps/map2/TrapNum2.vue', () => ({ default: 'TrapNum2_2' }))
vi.mock('@/components/game/traps/map2/TrapNum3.vue', () => ({ default: 'TrapNum3_2' }))
vi.mock('@/components/game/traps/map2/TrapNum4.vue', () => ({ default: 'TrapNum4_2' }))
vi.mock('@/components/game/traps/map2/TrapNum5.vue', () => ({ default: 'TrapNum5_2' }))
vi.mock('@/components/game/traps/map2/TrapNum6.vue', () => ({ default: 'TrapNum6_2' }))
vi.mock('@/components/game/traps/map2/TrapNum7.vue', () => ({ default: 'TrapNum7_2' }))
vi.mock('@/components/game/traps/map2/TrapNum8.vue', () => ({ default: 'TrapNum8_2' }))
vi.mock('@/components/game/traps/map2/TrapNum9.vue', () => ({ default: 'TrapNum9_2' }))
vi.mock('@/components/game/traps/map2/TrapNum10.vue', () => ({ default: 'TrapNum10_2' }))

vi.mock('@/components/game/traps/map1/TrapNum1.vue', () => ({ default: 'TrapNum1_1' }))
vi.mock('@/components/game/traps/map1/TrapNum2_1.vue', () => ({ default: 'TrapNum2_1_1' }))
vi.mock('@/components/game/traps/map1/TrapNum2_2.vue', () => ({ default: 'TrapNum2_2_1' }))
vi.mock('@/components/game/traps/map1/TrapNum5_1.vue', () => ({ default: 'TrapNum5_1_1' }))
vi.mock('@/components/game/traps/map1/TrapNum5_2.vue', () => ({ default: 'TrapNum5_2_1' }))
vi.mock('@/components/game/traps/map1/TrapNum6.vue', () => ({ default: 'TrapNum6_1' }))
vi.mock('@/components/game/traps/map1/TrapNum8_1.vue', () => ({ default: 'TrapNum8_1_1' }))
vi.mock('@/components/game/traps/map1/TrapNum8_2.vue', () => ({ default: 'TrapNum8_2_1' }))

describe('TRAPS_BY_MAP Configuration', () => {
  describe('Structure validation', () => {
    it('should be an object with map1 and map2 keys', () => {
      expect(TRAPS_BY_MAP).toBeTypeOf('object')
      expect(TRAPS_BY_MAP).toHaveProperty('map1')
      expect(TRAPS_BY_MAP).toHaveProperty('map2')
    })

    it('should have map1 and map2 as arrays', () => {
      expect(Array.isArray(TRAPS_BY_MAP.map1)).toBe(true)
      expect(Array.isArray(TRAPS_BY_MAP.map2)).toBe(true)
    })
  })

  describe('map2 traps', () => {
    const map2Traps = TRAPS_BY_MAP.map2

    it('should have exactly 10 traps for map2', () => {
      expect(map2Traps).toHaveLength(10)
    })

    it('should have traps with correct ids from 1 to 10', () => {
      const expectedIds = [
        'trap1', 'trap2', 'trap3', 'trap4', 'trap5',
        'trap6', 'trap7', 'trap8', 'trap9', 'trap10'
      ]
      expect(map2Traps.map(trap => trap.id)).toEqual(expectedIds)
    })

    it('should have correct trap names for map2', () => {
      const expectedNames = [
        'gas-trap',
        'falling-rocks',
        'water-poisoned',
        'rock',
        'falling-rocks-2',
        'rope_trap',
        'geyser',
        'board-4(trap)',
        'water-flow',
        'water-with-fish'
      ]
      expect(map2Traps.map(trap => trap.name)).toEqual(expectedNames)
    })

    it('should have correct Vue components for map2', () => {
      const expectedComponents = [
        'TrapNum1_2',
        'TrapNum2_2',
        'TrapNum3_2',
        'TrapNum4_2',
        'TrapNum5_2',
        'TrapNum6_2',
        'TrapNum7_2',
        'TrapNum8_2',
        'TrapNum9_2',
        'TrapNum10_2'
      ]
      expect(map2Traps.map(trap => trap.component)).toEqual(expectedComponents)
    })

    it('should have each trap with required properties', () => {
      map2Traps.forEach(trap => {
        expect(trap).toHaveProperty('id')
        expect(trap).toHaveProperty('name')
        expect(trap).toHaveProperty('component')
        expect(trap.id).toBeTypeOf('string')
        expect(trap.name).toBeTypeOf('string')
        expect(trap.component).toBeTruthy()
      })
    })

    it('should have unique trap ids in map2', () => {
      const ids = map2Traps.map(trap => trap.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique trap names in map2', () => {
      const names = map2Traps.map(trap => trap.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have trap with id "trap1" as first element', () => {
      expect(map2Traps[0].id).toBe('trap1')
      expect(map2Traps[0].name).toBe('gas-trap')
    })

    it('should have trap with id "trap10" as last element', () => {
      expect(map2Traps[9].id).toBe('trap10')
      expect(map2Traps[9].name).toBe('water-with-fish')
    })
  })

  describe('map1 traps', () => {
    const map1Traps = TRAPS_BY_MAP.map1

    it('should have exactly 8 traps for map1', () => {
      expect(map1Traps).toHaveLength(8)
    })

    it('should have correct trap ids for map1', () => {
      const expectedIds = [
        'trap1',
        'trap2_1',
        'trap2_2',
        'trap5_1',
        'trap5_2',
        'trap6',
        'trap8_1',
        'trap8_2'
      ]
      expect(map1Traps.map(trap => trap.id)).toEqual(expectedIds)
    })

    it('should have correct trap names for map1', () => {
      const expectedNames = [
        'fish',
        'stone-break-1',
        'stone-break-2',
        'tablet-4',
        'tablet-5',
        'falling-rocks2',
        'pit-1',
        'pit-2'
      ]
      expect(map1Traps.map(trap => trap.name)).toEqual(expectedNames)
    })

    it('should have correct Vue components for map1', () => {
      const expectedComponents = [
        'TrapNum1_1',
        'TrapNum2_1_1',
        'TrapNum2_2_1',
        'TrapNum5_1_1',
        'TrapNum5_2_1',
        'TrapNum6_1',
        'TrapNum8_1_1',
        'TrapNum8_2_1'
      ]
      expect(map1Traps.map(trap => trap.component)).toEqual(expectedComponents)
    })

    it('should have each trap with required properties', () => {
      map1Traps.forEach(trap => {
        expect(trap).toHaveProperty('id')
        expect(trap).toHaveProperty('name')
        expect(trap).toHaveProperty('component')
        expect(trap.id).toBeTypeOf('string')
        expect(trap.name).toBeTypeOf('string')
        expect(trap.component).toBeTruthy()
      })
    })

    it('should have unique trap ids in map1', () => {
      const ids = map1Traps.map(trap => trap.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique trap names in map1', () => {
      const names = map1Traps.map(trap => trap.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have grouped traps (trap2_1 and trap2_2)', () => {
      const trap2Group = map1Traps.filter(trap => trap.id.startsWith('trap2'))
      expect(trap2Group).toHaveLength(2)
      expect(trap2Group[0].id).toBe('trap2_1')
      expect(trap2Group[1].id).toBe('trap2_2')
    })

    it('should have grouped traps (trap5_1 and trap5_2)', () => {
      const trap5Group = map1Traps.filter(trap => trap.id.startsWith('trap5'))
      expect(trap5Group).toHaveLength(2)
      expect(trap5Group[0].id).toBe('trap5_1')
      expect(trap5Group[1].id).toBe('trap5_2')
    })

    it('should have grouped traps (trap8_1 and trap8_2)', () => {
      const trap8Group = map1Traps.filter(trap => trap.id.startsWith('trap8'))
      expect(trap8Group).toHaveLength(2)
      expect(trap8Group[0].id).toBe('trap8_1')
      expect(trap8Group[1].id).toBe('trap8_2')
    })
  })

  describe('Comparison between maps', () => {
    it('should have different number of traps for map1 and map2', () => {
      expect(TRAPS_BY_MAP.map1.length).not.toBe(TRAPS_BY_MAP.map2.length)
      expect(TRAPS_BY_MAP.map2.length).toBe(10)
      expect(TRAPS_BY_MAP.map1.length).toBe(8)
    })

    it('should have different trap names between maps', () => {
      const map1Names = TRAPS_BY_MAP.map1.map(trap => trap.name)
      const map2Names = TRAPS_BY_MAP.map2.map(trap => trap.name)
      
      const commonNames = map1Names.filter(name => map2Names.includes(name))
      expect(commonNames).toHaveLength(0)
    })

    it('should have different components between maps', () => {
      const map1Components = TRAPS_BY_MAP.map1.map(trap => trap.component)
      const map2Components = TRAPS_BY_MAP.map2.map(trap => trap.component)
      
      const commonComponents = map1Components.filter(comp => map2Components.includes(comp))
      expect(commonComponents).toHaveLength(0)
    })
  })

  describe('Edge cases and validation', () => {
    it('should not have empty trap arrays', () => {
      expect(TRAPS_BY_MAP.map1.length).toBeGreaterThan(0)
      expect(TRAPS_BY_MAP.map2.length).toBeGreaterThan(0)
    })

    it('should have consistent trap object structure', () => {
      const allTraps = [...TRAPS_BY_MAP.map1, ...TRAPS_BY_MAP.map2]
      
      allTraps.forEach(trap => {
        expect(Object.keys(trap)).toEqual(['id', 'name', 'component'])
        expect(Object.keys(trap)).toHaveLength(3)
      })
    })

    it('should have trap ids that match pattern', () => {
      const allTraps = [...TRAPS_BY_MAP.map1, ...TRAPS_BY_MAP.map2]
      
      allTraps.forEach(trap => {
        // Проверяем, что id начинается с 'trap' и содержит цифры
        expect(trap.id).toMatch(/^trap\d+(_\d+)?$/)
      })
    })

    it('should not have traps with empty names', () => {
      const allTraps = [...TRAPS_BY_MAP.map1, ...TRAPS_BY_MAP.map2]
      
      allTraps.forEach(trap => {
        expect(trap.name.trim()).not.toBe('')
        expect(trap.name.length).toBeGreaterThan(0)
      })
    })

    it('should have all components defined (not undefined or null)', () => {
      const allTraps = [...TRAPS_BY_MAP.map1, ...TRAPS_BY_MAP.map2]
      
      allTraps.forEach(trap => {
        expect(trap.component).toBeDefined()
        expect(trap.component).not.toBeNull()
      })
    })
  })

  describe('Accessibility tests', () => {
    it('should be accessible by map key', () => {
      expect(TRAPS_BY_MAP['map1']).toBeDefined()
      expect(TRAPS_BY_MAP['map2']).toBeDefined()
    })

    it('should return undefined for non-existent map key', () => {
      expect(TRAPS_BY_MAP['map3']).toBeUndefined()
      expect(TRAPS_BY_MAP['invalid']).toBeUndefined()
    })

    it('should allow iteration over map keys', () => {
      const keys = Object.keys(TRAPS_BY_MAP)
      expect(keys).toContain('map1')
      expect(keys).toContain('map2')
      expect(keys).toHaveLength(2)
    })

    it('should allow getting trap by index', () => {
      expect(TRAPS_BY_MAP.map1[0].id).toBe('trap1')
      expect(TRAPS_BY_MAP.map2[0].id).toBe('trap1')
    })
  })

  describe('TypeScript type safety (runtime checks)', () => {
    it('should have correct types for all trap properties', () => {
      const allTraps = [...TRAPS_BY_MAP.map1, ...TRAPS_BY_MAP.map2]
      
      allTraps.forEach(trap => {
        // Проверка типов во время выполнения
        expect(typeof trap.id).toBe('string')
        expect(typeof trap.name).toBe('string')
        expect(typeof trap.component).toBe('string') // так как мы замокали
      })
    })
  })
})