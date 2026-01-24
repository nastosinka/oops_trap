import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MapEditor from '@/components/dev/DevMapEditor.vue'

describe('MapEditor.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(MapEditor, {
      attachTo: document.body
    })

    // Мокаем canvas
    const canvas = wrapper.vm.$refs.canvas
    canvas.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn()
    }))

    global.alert = vi.fn()
  })

  it('рендерит основные элементы', () => {
    expect(wrapper.find('h1').text()).toBe('Редактор карты')
    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.findAll('input[type="file"]').length).toBe(2)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('добавляет новый полигон при finishPolygon', async () => {
    wrapper.vm.currentPolygon.points.push({ x: 10, y: 20 })
    wrapper.vm.currentPolygon.points.push({ x: 30, y: 40 })
    await wrapper.vm.finishPolygon()
    expect(wrapper.vm.polygons).toHaveLength(1)
    expect(wrapper.vm.currentPolygon.points).toHaveLength(0)
  })

  it('показывает alert если точек меньше 2 при finishPolygon', async () => {
    wrapper.vm.currentPolygon.points.push({ x: 0, y: 0 })
    await wrapper.vm.finishPolygon()
    expect(global.alert).toHaveBeenCalledWith(
      'Полигон должен иметь минимум 2 точки'
    )
    expect(wrapper.vm.polygons).toHaveLength(0)
  })

  it('выбирает полигон и редактирует его', async () => {
    wrapper.vm.polygons.push({
      name: 'Test',
      type: 'rope',
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ],
      timer: 1000,
      isActive: true
    })

    await wrapper.vm.selectPolygon(0)
    expect(wrapper.vm.selectedPolygonIndex).toBe(0)
    expect(wrapper.vm.polygonEditor.name).toBe('Test')

    wrapper.vm.polygonEditor.name = 'Edited'
    wrapper.vm.applyPolygonEdit()
    expect(wrapper.vm.polygons[0].name).toBe('Edited')
  })

  it('удаляет полигон', async () => {
    wrapper.vm.polygons.push({ name: 'DeleteMe', points: [] })
    await wrapper.vm.deletePolygon(0)
    expect(wrapper.vm.polygons).toHaveLength(0)
    expect(wrapper.vm.selectedPolygonIndex).toBeNull()
  })

  it('transformMouseToImage корректно преобразует координаты', () => {
    wrapper.vm.scale = 2
    const pos = wrapper.vm.transformMouseToImage(100, 50)
    expect(pos).toEqual({ x: 50, y: 25 })
  })

  it('onMouseDown добавляет точку к currentPolygon если нет выбранного полигона', async () => {
    const canvas = wrapper.vm.$refs.canvas
    const rect = { left: 0, top: 0 }
    canvas.getBoundingClientRect = vi.fn(() => rect)

    await wrapper.vm.onMouseDown({ clientX: 10, clientY: 20 })
    expect(wrapper.vm.currentPolygon.points).toHaveLength(1)
    expect(wrapper.vm.currentPolygon.points[0]).toEqual({ x: 10, y: 20 })
  })

  it('drag & drop точки работает через onMouseDown, onMouseMove, onMouseUp', async () => {
    // Создаем полигон и выбираем его
    wrapper.vm.polygons.push({
      name: 'DragPoly',
      type: 'rope',
      points: [{ x: 10, y: 10 }]
    })
    wrapper.vm.selectedPolygonIndex = 0

    const canvas = wrapper.vm.$refs.canvas
    canvas.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0 }))

    // Выбираем точку для drag
    await wrapper.vm.onMouseDown({ clientX: 10, clientY: 10 })
    expect(wrapper.vm.draggedPointIndex).toBe(0)

    // Двигаем точку
    await wrapper.vm.onMouseMove({ clientX: 20, clientY: 30 })
    expect(wrapper.vm.polygons[0].points[0]).toEqual({ x: 20, y: 30 })

    // Отпускаем мышь
    wrapper.vm.onMouseUp()
    expect(wrapper.vm.draggedPointIndex).toBeNull()
  })

  it('сохраняет JSON', async () => {
    const aClick = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:url'),
      revokeObjectURL: vi.fn()
    })
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ href: '', download: '', click: aClick }))
    })

    wrapper.vm.polygons.push({ name: 'Test', points: [] })
    wrapper.vm.saveJson()
    expect(aClick).toHaveBeenCalled()
  })
})
