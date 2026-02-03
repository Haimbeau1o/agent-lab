import { describe, it, expect, vi } from 'vitest'
import { LLMReranker } from './llm-reranker.js'
import type { LLMClient } from '../../../lib/llm/client.js'

describe('LLMReranker', () => {
  it('reranks using LLM scores', async () => {
    const llm = {
      chat: vi.fn().mockResolvedValue({ content: '{"scores":[1,0]}' })
    } as unknown as LLMClient

    const reranker = new LLMReranker(llm)

    const chunks = [
      { chunkId: 'c1', text: 'Alpha', score: 0.1, rank: 1 },
      { chunkId: 'c2', text: 'Beta', score: 0.9, rank: 2 }
    ]

    const out = await reranker.rerank(chunks, 'query')

    expect(out[0].chunkId).toBe('c1')
    expect(out[0].rank).toBe(1)
  })
})
