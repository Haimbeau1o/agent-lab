import { describe, it, expect } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

const docs = [
  { id: 'd1', text: 'Alpha only document' },
  { id: 'd2', text: 'Beta only document' },
  { id: 'd3', text: 'Gamma only document' }
]

describe('RagBm25Runner rerank', () => {
  it('does not create rag.reranked when reranker disabled', async () => {
    const runner = new RagBm25Runner()
    const task: AtomicTask = {
      id: 'task-rerank-off',
      name: 'RAG rerank off',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 1 },
      generator: { type: 'template' },
      reranker: { enabled: false, type: 'simple' }
    })

    const schemaIds = run.artifacts.map(a => a.schemaId)
    expect(schemaIds).toContain('rag.retrieved')
    expect(schemaIds).toContain('rag.generated')
    expect(schemaIds).not.toContain('rag.reranked')
  })

  it('creates rag.reranked and uses it for generation when enabled', async () => {
    const reranker = {
      rerank: (chunks: Array<{ chunkId: string; text: string; score: number; rank: number }>) => {
        const reversed = [...chunks].reverse()
        return reversed.map((chunk, index) => ({ ...chunk, rank: index + 1 }))
      }
    }

    const runner = new RagBm25Runner({ reranker })
    const task: AtomicTask = {
      id: 'task-rerank-on',
      name: 'RAG rerank on',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 2 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 2 },
      generator: { type: 'template' },
      reranker: { enabled: true, type: 'simple' }
    })

    const reranked = run.artifacts.find(a => a.schemaId === 'rag.reranked')
    expect(reranked).toBeDefined()

    const rerankedChunks = (reranked as any).payload.chunks
    expect(rerankedChunks[0].rank).toBe(1)

    const generated = run.output as any
    expect(generated.sentences[0].text).toBe(rerankedChunks[0].text)
  })
})
