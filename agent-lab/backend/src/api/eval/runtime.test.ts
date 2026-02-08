import { describe, expect, it } from 'vitest'
import { InMemoryStorage } from '../../core/engine/storage.js'
import type { AtomicTask } from '../../core/contracts/task.js'
import { createEvalRuntime } from './runtime.js'

describe('createEvalRuntime', () => {
  it('registers real rag runner and rag definitions', () => {
    const runtime = createEvalRuntime({ storage: new InMemoryStorage() })

    expect(runtime.runnerRegistry.get('rag.bm25')).toBeTruthy()
    expect(runtime.runnerRegistry.get('rag.mock')).toBeNull()

    expect(runtime.taskDefinitionRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.qa', type: 'rag' })
    ])
    expect(runtime.workflowDefinitionRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.retrieve-generate' })
    ])
    expect(runtime.methodDefinitionRegistry.list()).toEqual([
      expect.objectContaining({ id: 'rag.bm25.template' })
    ])
  })

  it('runs rag pipeline with artifacts, reports, scores and reproducible provenance', async () => {
    const storage = new InMemoryStorage()
    const runtime = createEvalRuntime({ storage })

    const task: AtomicTask = {
      id: 'task-rag-1',
      name: 'RAG QA',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const result = await runtime.engine.evaluateTask(
      task,
      'rag.bm25',
      {
        dataset: {
          documents: [
            { id: 'd1', text: 'Alpha is the first letter.' },
            { id: 'd2', text: 'Beta is the second letter.' },
            { id: 'd3', text: 'Gamma is the third letter.' }
          ]
        },
        retriever: { type: 'bm25', impl: 'wink', topK: 1 },
        generator: { type: 'template' }
      },
      ['rag.metrics']
    )

    expect(result.run.status).toBe('completed')
    expect(result.run.artifacts?.length ?? 0).toBeGreaterThan(0)
    expect(result.run.reports?.length ?? 0).toBeGreaterThan(0)
    expect(result.scores.some(score => score.metric === 'citation_precision')).toBe(true)

    expect(result.run.provenance.configSnapshot).toEqual(
      expect.objectContaining({
        task,
        runnerId: 'rag.bm25'
      })
    )
    expect(result.run.provenance.runFingerprint).toEqual(expect.any(String))

    const savedRun = await storage.getRun(result.run.id)
    expect(savedRun?.provenance.configSnapshot).toEqual(
      expect.objectContaining({
        task,
        runnerId: 'rag.bm25'
      })
    )
    expect(savedRun?.provenance.runFingerprint).toEqual(expect.any(String))
  })
})
