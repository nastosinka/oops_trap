import { describe, it, expect } from 'vitest'
import { sum } from '@/temporary-test-functions/math'

describe('math utils', () => {
  it('sums numbers correctly', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
