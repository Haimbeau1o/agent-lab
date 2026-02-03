import { describe, it, expect, vi } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('RagBm25Runner hybrid', () => {
  const docs = [
    { id: 'd1', text: 'Alpha only document' },
    { id: 'd2', text: 'Beta only document' },
    { id: 'd3', text: 'Gamma only document' }
  ]

  it('falls back to rag.retrieved when rag.reranked is missing', async () => {
    const runner = new RagBm25Runner()

    const task: AtomicTask = {
      id: 'task-hybrid',
      name: 'RAG hybrid',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 1 },
      generator: { type: 'template' }
    })

    const schemaIds = run.artifacts.map(a => a.schemaId)
    expect(schemaIds).toContain('rag.retrieved')
    expect(schemaIds).not.toContain('rag.reranked')
    expect(run.output.sentences[0].text).toBeDefined()
  })

  it('uses hybrid retriever when configured', async () => {
    const hybridRetriever = {
      search: vi.fn().mockResolvedValue([
        { chunkId: 'd2', score: 1, rank: 1 }
      ])
    }

    const runner = new RagBm25Runner({ hybridRetriever } as any)

    const task: AtomicTask = {
      id: 'task-hybrid-on',
      name: 'RAG hybrid on',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'hybrid', impl: 'wink', topK: 1 },
      generator: { type: 'template' }
    } as any)

    expect(hybridRetriever.search).toHaveBeenCalled()
    expect(run.output.sentences[0].text).toBe('Beta only document')
  })
})
