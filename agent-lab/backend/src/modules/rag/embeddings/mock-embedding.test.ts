import { describe, it, expect } from 'vitest'
import { MockEmbedding } from './mock-embedding.js'

describe('MockEmbedding', () => {
  it('returns deterministic vectors for same input', async () => {
    const embedder = new MockEmbedding()
    const first = await embedder.embed(['alpha'])
    const second = await embedder.embed(['alpha'])
    expect(first).toEqual(second)
  })
})
