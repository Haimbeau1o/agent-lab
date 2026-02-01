import { describe, it, expect } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

const docs = [
  { id: 'd1', text: 'alpha only document' },
  { id: 'd2', text: 'beta only document' },
  { id: 'd3', text: 'gamma only document' }
]

describe('RagBm25Runner', () => {
  it('retrieves documents by bm25 rank', async () => {
    const runner = new RagBm25Runner()
    const task: AtomicTask = {
      id: 'task-1',
      name: 'RAG query',
      type: 'rag',
      input: { query: 'alpha', retrieval: { topK: 2 } },
      metadata: {}
    }

    const result = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 2 },
      generator: { type: 'template' }
    })

    const retrieved = result.artifacts?.find(a => a.schemaId === 'rag.retrieved')
    expect(retrieved).toBeDefined()

    const payload = retrieved?.payload as any
    expect(payload.query).toBe('alpha')
    expect(payload.topKUsed).toBe(2)
    expect(payload.chunks[0].chunkId).toBe('d1')
    expect(payload.chunks[0].rank).toBe(1)
    expect(payload.chunks[1].rank).toBe(2)
  })
})
