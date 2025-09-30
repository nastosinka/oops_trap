import { describe, it, expect } from 'vitest'
import router from '@/router'

describe('router', () => {
  it('creates a router instance', () => {
    expect(router).toBeTruthy()
    expect(router.getRoutes).toBeInstanceOf(Function)
  })

  it('has required routes', () => {
    const routes = router.getRoutes()
    const routeNames = routes.map(r => r.name)

    expect(routeNames).toContain('Home')
    expect(routeNames).toContain('Lobby')
    expect(routeNames).toContain('Game')
    expect(routeNames).toContain('Results')
  })

  it('matches path "/" to Home', () => {
    const match = router.resolve('/')
    expect(match.name).toBe('Home')
  })
})
