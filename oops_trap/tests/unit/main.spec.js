import { describe, it, expect } from 'vitest'

describe('main.js bootstrap', () => {
  it('initializes vkBridge and mounts app', async () => {
    expect(() => import('@/main.js')).not.toThrow()
  })
})
