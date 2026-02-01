import { describe, it, expect } from 'vitest'
import { RagBm25Runner } from './rag-bm25-runner.js'
import { RagEvidenceReporter } from '../reporters/rag-evidence-reporter.js'
import { RagMetricsEvaluator } from '../evaluators/rag-metrics-evaluator.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

const docs = [
  { id: 'd1', text: 'Alpha only document' },
  { id: 'd2', text: 'beta only document' },
  { id: 'd3', text: 'gamma only document' }
]

describe('RagBm25Runner e2e', () => {
  it('produces artifacts that yield perfect metrics', async () => {
    const runner = new RagBm25Runner()
    const reporter = new RagEvidenceReporter()
    const evaluator = new RagMetricsEvaluator()

    const task: AtomicTask = {
      id: 'task-2',
      name: 'RAG e2e',
      type: 'rag',
      input: { query: 'Alpha', retrieval: { topK: 1 } },
      metadata: {}
    }

    const run = await runner.execute(task, {
      dataset: { documents: docs },
      retriever: { type: 'bm25', impl: 'wink', topK: 1 },
      generator: { type: 'template' }
    })

    const reports = await reporter.run(run.id, {
      artifacts: run.artifacts
    })

    const scores = await evaluator.evaluate(run, task, reports)
    const metrics = reports[0].payload as any

    expect(metrics.metrics.citation_precision).toBe(1)
    expect(metrics.metrics.hallucination_rate).toBe(0)
    expect(metrics.taxonomy).not.toBe('evidence_link_failed')
    expect(scores[0].metric).toBe('citation_precision')
  })
})
