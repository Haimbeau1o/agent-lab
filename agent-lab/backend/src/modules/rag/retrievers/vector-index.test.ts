import { describe, it, expect } from 'vitest'
import { InMemoryVectorIndex } from './vector-index.js'

describe('InMemoryVectorIndex', () => {
  it('returns topK most similar vectors', () => {
    const index = new InMemoryVectorIndex()
    index.add('d1', [1, 0, 0])
    index.add('d2', [0, 1, 0])
    const results = index.search([1, 0, 0], 1)
    expect(results[0].id).toBe('d1')
  })
})
