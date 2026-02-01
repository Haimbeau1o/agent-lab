import { describe, it, expect, beforeEach } from 'vitest'
import { EvalEngine } from './eval-engine.js'
import { InMemoryStorage } from './storage.js'
import { RunnerRegistry } from '../registry/runner-registry.js'
import { EvaluatorRegistry } from '../registry/evaluator-registry.js'
import { ReporterRegistry } from '../registry/reporter-registry.js'
import type { Runner } from '../contracts/runner.js'
import type { Evaluator } from '../contracts/evaluator.js'
import type { Reporter, ReportRecord } from '../contracts/report.js'
import type { AtomicTask } from '../contracts/task.js'
import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'
import { randomUUID } from 'crypto'

class MockRunner implements Runner {
  readonly id = 'mock.runner'
  readonly type = 'mock'
  readonly version = '1.0.0'

  async execute(task: AtomicTask): Promise<RunRecord> {
    return {
      id: randomUUID(),
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: { result: 'ok' },
      metrics: { latency: 1 },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: this.id,
        runnerVersion: this.version,
        config: {}
      }
    }
  }
}

class MockReporter implements Reporter {
  id = 'mock.reporter'
  types = ['mock.report']

  async run(runId: string): Promise<ReportRecord[]> {
    return [{
      id: `rep-${runId}`,
      runId,
      type: 'mock.report',
      payload: { ok: true },
      producedAt: new Date()
    }]
  }
}

class MockEvaluator implements Evaluator {
  readonly id = 'mock.evaluator'
  readonly metrics = ['mock']

  async evaluate(run: RunRecord, task: AtomicTask, reports?: ReportRecord[]): Promise<ScoreRecord[]> {
    return [{
      id: `score-${run.id}`,
      runId: run.id,
      metric: 'mock',
      value: 1,
      target: 'final',
      evidence: {
        reportRefs: reports?.map(r => r.id) ?? []
      },
      evaluatorId: this.id,
      createdAt: new Date()
    }]
  }
}

describe('EvalEngine reporter pipeline', () => {
  let engine: EvalEngine

  beforeEach(() => {
    const runnerRegistry = new RunnerRegistry()
    const evaluatorRegistry = new EvaluatorRegistry()
    const reporterRegistry = new ReporterRegistry()

    runnerRegistry.register(new MockRunner())
    evaluatorRegistry.register(new MockEvaluator())
    reporterRegistry.register(new MockReporter())

    engine = new EvalEngine({
      runnerRegistry,
      evaluatorRegistry,
      reporterRegistry,
      storage: new InMemoryStorage()
    })
  })

  it('runs reporters before evaluators', async () => {
    const task: AtomicTask = {
      id: 'task-1',
      name: 'Test Task',
      type: 'mock',
      input: { text: 'test' },
      metadata: {}
    }

    const result = await engine.evaluateTask(task, 'mock.runner', {})

    expect(result.run.reports?.length).toBe(1)
    expect(result.scores[0].evidence?.reportRefs?.length).toBe(1)
  })
})
