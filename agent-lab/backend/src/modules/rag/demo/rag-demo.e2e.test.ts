import { beforeEach, describe, expect, it } from 'vitest'
import type { AtomicTask } from '../../../core/contracts/task.js'
import { EvalEngine } from '../../../core/engine/eval-engine.js'
import { InMemoryStorage } from '../../../core/engine/storage.js'
import { EvaluatorRegistry } from '../../../core/registry/evaluator-registry.js'
import { ReporterRegistry } from '../../../core/registry/reporter-registry.js'
import { RunnerRegistry } from '../../../core/registry/runner-registry.js'
import { RagBm25Runner } from '../runners/rag-bm25-runner.js'
import { RagMetricsEvaluator } from '../evaluators/rag-metrics-evaluator.js'
import { RagEvidenceReporter } from '../reporters/rag-evidence-reporter.js'
import {
  RAG_DEMO_DATASET,
  buildRagDemoConfig,
  buildRagDemoTask
} from './index.js'

describe('RAG demo e2e', () => {
  let engine: EvalEngine

  beforeEach(() => {
    const runnerRegistry = new RunnerRegistry()
    const evaluatorRegistry = new EvaluatorRegistry()
    const reporterRegistry = new ReporterRegistry()

    runnerRegistry.register(new RagBm25Runner())
    evaluatorRegistry.register(new RagMetricsEvaluator())
    reporterRegistry.register(new RagEvidenceReporter())

    engine = new EvalEngine({
      runnerRegistry,
      evaluatorRegistry,
      reporterRegistry,
      storage: new InMemoryStorage()
    })
  })

  it('produces stable fingerprint for same input and default config', async () => {
    const taskA: AtomicTask = buildRagDemoTask({ id: 'rag-demo-task' })
    const taskB: AtomicTask = buildRagDemoTask({ id: 'rag-demo-task' })

    const configA = buildRagDemoConfig()
    const configB = buildRagDemoConfig()

    expect(RAG_DEMO_DATASET.documents.length).toBeGreaterThan(0)

    const first = await engine.evaluateTask(taskA, 'rag.bm25', configA, ['rag.metrics'])
    const second = await engine.evaluateTask(taskB, 'rag.bm25', configB, ['rag.metrics'])

    expect(first.run.status).toBe('completed')
    expect(second.run.status).toBe('completed')

    expect(first.run.provenance.configHash).toBeDefined()
    expect(first.run.provenance.runFingerprint).toBeDefined()
    expect(first.run.provenance.runFingerprint).toBe(second.run.provenance.runFingerprint)
    expect(first.run.provenance.configHash).toBe(second.run.provenance.configHash)

    expect(first.run.output).toEqual(second.run.output)
    expect(first.run.provenance.configSnapshot).toEqual(
      expect.objectContaining({ runnerId: 'rag.bm25' })
    )
    expect(first.scores.some(score => score.metric === 'citation_precision')).toBe(true)
  })
})
