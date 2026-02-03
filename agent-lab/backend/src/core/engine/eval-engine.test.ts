/**
 * EvalEngine 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EvalEngine } from './eval-engine.js'
import { InMemoryStorage } from './storage.js'
import { RunnerRegistry } from '../registry/runner-registry.js'
import { EvaluatorRegistry } from '../registry/evaluator-registry.js'
import type { Runner } from '../contracts/runner.js'
import type { Evaluator } from '../contracts/evaluator.js'
import type { AtomicTask } from '../contracts/task.js'
import type { RunRecord } from '../contracts/run-record.js'
import type { ScoreRecord } from '../contracts/score-record.js'
import { randomUUID } from 'crypto'

// Mock Runner
class MockRunner implements Runner {
  readonly id = 'mock.runner'
  readonly type = 'mock'
  readonly version = '1.0.0'

  async execute(task: AtomicTask, config: unknown): Promise<RunRecord> {
    return {
      id: randomUUID(),
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: { result: 'success' },
      metrics: {
        latency: 100,
        tokens: 50,
        cost: 0.001
      },
      trace: [
        {
          timestamp: new Date(),
          level: 'info',
          event: 'execution_start',
          data: {}
        }
      ],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: this.id,
        runnerVersion: this.version,
        config: config as Record<string, unknown>
      }
    }
  }
}

// Mock Evaluator
class MockEvaluator implements Evaluator {
  readonly id = 'mock.evaluator'
  readonly metrics = ['accuracy', 'latency']

  async evaluate(run: RunRecord, task: AtomicTask): Promise<ScoreRecord[]> {
    return [
      {
        id: randomUUID(),
        runId: run.id,
        metric: 'accuracy',
        value: 1,
        target: 'final',
        evidence: {
          explanation: 'Perfect accuracy'
        },
        evaluatorId: this.id,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        runId: run.id,
        metric: 'latency',
        value: run.metrics.latency,
        target: 'global',
        evidence: {
          explanation: `Latency: ${run.metrics.latency}ms`
        },
        evaluatorId: this.id,
        createdAt: new Date()
      }
    ]
  }
}

describe('EvalEngine', () => {
  let engine: EvalEngine
  let storage: InMemoryStorage
  let runnerRegistry: RunnerRegistry
  let evaluatorRegistry: EvaluatorRegistry
  let mockRunner: MockRunner
  let mockEvaluator: MockEvaluator

  beforeEach(() => {
    storage = new InMemoryStorage()
    runnerRegistry = new RunnerRegistry()
    evaluatorRegistry = new EvaluatorRegistry()

    mockRunner = new MockRunner()
    mockEvaluator = new MockEvaluator()

    runnerRegistry.register(mockRunner)
    evaluatorRegistry.register(mockEvaluator)

    engine = new EvalEngine({
      runnerRegistry,
      evaluatorRegistry,
      storage
    })
  })

  describe('evaluateTask', () => {
    const task: AtomicTask = {
      id: 'task-1',
      name: 'Test Task',
      type: 'mock',
      input: { text: 'test' },
      expected: { result: 'success' },
      metadata: {}
    }

    it('should execute task and return result', async () => {
      const result = await engine.evaluateTask(task, 'mock.runner', {})

      expect(result.run).toBeDefined()
      expect(result.run.taskId).toBe('task-1')
      expect(result.run.status).toBe('completed')
      expect(result.scores).toHaveLength(2)
    })

    it('should save run and scores to storage', async () => {
      const result = await engine.evaluateTask(task, 'mock.runner', {})

      const savedRun = await storage.getRun(result.run.id)
      expect(savedRun).toBeDefined()
      expect(savedRun?.id).toBe(result.run.id)

      const savedScores = await storage.getScores(result.run.id)
      expect(savedScores).toHaveLength(2)
    })

    it('should throw error for non-existent runner', async () => {
      await expect(
        engine.evaluateTask(task, 'non-existent', {})
      ).rejects.toThrow('Runner not found')
    })

    it('should throw error for type mismatch', async () => {
      const wrongTask: AtomicTask = {
        ...task,
        type: 'wrong-type'
      }

      await expect(
        engine.evaluateTask(wrongTask, 'mock.runner', {})
      ).rejects.toThrow('Runner type mismatch')
    })

    it('should use specified evaluators', async () => {
      const result = await engine.evaluateTask(
        task,
        'mock.runner',
        {},
        ['mock.evaluator']
      )

      expect(result.scores).toHaveLength(2)
      expect(result.scores.every(s => s.evaluatorId === 'mock.evaluator')).toBe(true)
    })

    it('adds configHash and runFingerprint to run provenance', async () => {
      const result = await engine.evaluateTask(task, 'mock.runner', { mode: 'test' })

      expect(result.run.provenance.configHash).toBeDefined()
      expect(result.run.provenance.runFingerprint).toBeDefined()
    })

    it('should handle evaluator failures gracefully', async () => {
      // 注册一个会失败的 evaluator
      class FailingEvaluator implements Evaluator {
        readonly id = 'failing.evaluator'
        readonly metrics = ['test']

        async evaluate(): Promise<ScoreRecord[]> {
          throw new Error('Evaluator failed')
        }
      }

      evaluatorRegistry.register(new FailingEvaluator())

      // 应该不会抛出错误，只是没有该 evaluator 的评分
      const result = await engine.evaluateTask(task, 'mock.runner', {})

      expect(result.run).toBeDefined()
      // 只有 mock.evaluator 的评分，没有 failing.evaluator 的
      expect(result.scores.every(s => s.evaluatorId === 'mock.evaluator')).toBe(true)
    })
  })

  describe('evaluateBatch', () => {
    const tasks: AtomicTask[] = [
      {
        id: 'task-1',
        name: 'Task 1',
        type: 'mock',
        input: { text: 'test1' },
        metadata: {}
      },
      {
        id: 'task-2',
        name: 'Task 2',
        type: 'mock',
        input: { text: 'test2' },
        metadata: {}
      },
      {
        id: 'task-3',
        name: 'Task 3',
        type: 'mock',
        input: { text: 'test3' },
        metadata: {}
      }
    ]

    it('should execute multiple tasks', async () => {
      const results = await engine.evaluateBatch(tasks, 'mock.runner', {})

      expect(results).toHaveLength(3)
      expect(results[0].run.taskId).toBe('task-1')
      expect(results[1].run.taskId).toBe('task-2')
      expect(results[2].run.taskId).toBe('task-3')
    })

    it('should save all runs to storage', async () => {
      const results = await engine.evaluateBatch(tasks, 'mock.runner', {})

      for (const result of results) {
        const savedRun = await storage.getRun(result.run.id)
        expect(savedRun).toBeDefined()
      }
    })
  })

  describe('getRun', () => {
    it('should retrieve saved run', async () => {
      const task: AtomicTask = {
        id: 'task-1',
        name: 'Test',
        type: 'mock',
        input: {},
        metadata: {}
      }

      const result = await engine.evaluateTask(task, 'mock.runner', {})
      const retrieved = await engine.getRun(result.run.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(result.run.id)
    })

    it('should return null for non-existent run', async () => {
      const retrieved = await engine.getRun('non-existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('getScores', () => {
    it('should retrieve saved scores', async () => {
      const task: AtomicTask = {
        id: 'task-1',
        name: 'Test',
        type: 'mock',
        input: {},
        metadata: {}
      }

      const result = await engine.evaluateTask(task, 'mock.runner', {})
      const scores = await engine.getScores(result.run.id)

      expect(scores).toHaveLength(2)
      expect(scores[0].runId).toBe(result.run.id)
    })

    it('should return empty array for non-existent run', async () => {
      const scores = await engine.getScores('non-existent')
      expect(scores).toHaveLength(0)
    })
  })

  describe('listRuns', () => {
    beforeEach(async () => {
      const tasks: AtomicTask[] = [
        { id: 'task-1', name: 'Task 1', type: 'mock', input: {}, metadata: {} },
        { id: 'task-2', name: 'Task 2', type: 'mock', input: {}, metadata: {} },
        { id: 'task-3', name: 'Task 3', type: 'mock', input: {}, metadata: {} }
      ]

      await engine.evaluateBatch(tasks, 'mock.runner', {})
    })

    it('should list all runs', async () => {
      const runs = await engine.listRuns()
      expect(runs).toHaveLength(3)
    })

    it('should filter by taskId', async () => {
      const runs = await engine.listRuns({ taskId: 'task-1' })
      expect(runs).toHaveLength(1)
      expect(runs[0].taskId).toBe('task-1')
    })

    it('should filter by status', async () => {
      const runs = await engine.listRuns({ status: 'completed' })
      expect(runs).toHaveLength(3)
    })

    it('should support pagination', async () => {
      const page1 = await engine.listRuns({ limit: 2, offset: 0 })
      expect(page1).toHaveLength(2)

      const page2 = await engine.listRuns({ limit: 2, offset: 2 })
      expect(page2).toHaveLength(1)
    })
  })

  describe('getEvalResult', () => {
    it('should get complete eval result', async () => {
      const task: AtomicTask = {
        id: 'task-1',
        name: 'Test',
        type: 'mock',
        input: {},
        metadata: {}
      }

      const result = await engine.evaluateTask(task, 'mock.runner', {})
      const evalResult = await engine.getEvalResult(result.run.id)

      expect(evalResult).toBeDefined()
      expect(evalResult?.run.id).toBe(result.run.id)
      expect(evalResult?.scores).toHaveLength(2)
    })

    it('should return null for non-existent run', async () => {
      const evalResult = await engine.getEvalResult('non-existent')
      expect(evalResult).toBeNull()
    })
  })

  describe('compareRuns', () => {
    it('should compare two runs', async () => {
      const task: AtomicTask = {
        id: 'task-1',
        name: 'Test',
        type: 'mock',
        input: {},
        metadata: {}
      }

      const result1 = await engine.evaluateTask(task, 'mock.runner', {})
      const result2 = await engine.evaluateTask(task, 'mock.runner', {})

      const comparison = await engine.compareRuns(result1.run.id, result2.run.id)

      expect(comparison).toBeDefined()
      expect(comparison?.run1.run.id).toBe(result1.run.id)
      expect(comparison?.run2.run.id).toBe(result2.run.id)
      expect(comparison?.comparison.length).toBeGreaterThan(0)
    })

    it('should calculate diff for numeric metrics', async () => {
      const task: AtomicTask = {
        id: 'task-1',
        name: 'Test',
        type: 'mock',
        input: {},
        metadata: {}
      }

      const result1 = await engine.evaluateTask(task, 'mock.runner', {})
      const result2 = await engine.evaluateTask(task, 'mock.runner', {})

      const comparison = await engine.compareRuns(result1.run.id, result2.run.id)

      const accuracyComparison = comparison?.comparison.find(c => c.metric === 'accuracy')
      expect(accuracyComparison).toBeDefined()
      expect(accuracyComparison?.diff).toBeDefined()
    })

    it('should return null if either run does not exist', async () => {
      const comparison = await engine.compareRuns('non-existent-1', 'non-existent-2')
      expect(comparison).toBeNull()
    })
  })

describe('getRunDetail', () => {
  it('returns run and scores for existing run', async () => {
    const task: AtomicTask = {
      id: 'task-2',
      name: 'Test Task',
      type: 'mock',
      input: { text: 'test' },
      expected: { result: 'success' },
      metadata: {}
    }

    const result = await engine.evaluateTask(task, 'mock.runner', {})
    const detail = await engine.getRunDetail(result.run.id)

    expect(detail).toBeDefined()
    expect(detail?.run.id).toBe(result.run.id)
    expect(detail?.scores).toHaveLength(2)
  })
})

})
