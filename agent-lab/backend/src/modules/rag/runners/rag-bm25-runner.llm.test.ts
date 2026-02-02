import { describe, it, expect, vi } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

const docs = [
  { id: 'd1', text: 'Alpha only document' },
  { id: 'd2', text: 'Beta only document' },
  { id: 'd3', text: 'Gamma only document' }
]

describe('RagBm25Runner with LLM generator', () => {
  it('uses the injected LLM generator when type=llm', async () => {
    const llmGenerator = {
      generate: vi.fn().mockResolvedValue({
        answer: 'Alpha answer.',
        sentences: [
          { sentenceId: 's1', text: 'Alpha answer.', citations: [{ chunkId: 'd1' }] }
        ],
        generatorType: 'llm',
        sourcesUsed: ['d1']
      })
    }

    const runner = new RagBm25Runner({ llmGenerator })

    const task: AtomicTask = {
      id: 'task-llm',
      name: 'RAG LLM',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 1 },
      generator: { type: 'llm' }
    })

    expect(llmGenerator.generate).toHaveBeenCalledWith({
      query: 'Alpha',
      retrievedChunks: [
        expect.objectContaining({ chunkId: 'd1', text: 'Alpha only document' })
      ]
    })
    expect(run.output.generatorType).toBe('llm')
  })
})
