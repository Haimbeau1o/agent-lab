/**
 * MemoryMetricsEvaluator 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryMetricsEvaluator } from './memory-metrics-evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('MemoryMetricsEvaluator', () => {
  let evaluator: MemoryMetricsEvaluator

  beforeEach(() => {
    evaluator = new MemoryMetricsEvaluator()
  })

  describe('metadata', () => {
    it('should have correct id and metrics', () => {
      expect(evaluator.id).toBe('memory.metrics')
      expect(evaluator.metrics).toEqual(['accuracy', 'memory_count', 'latency'])
    })
  })

  describe('evaluate - extract', () => {
    const extractTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Memory Extract',
      type: 'memory',
      input: {
        operation: 'extract',
        message: 'My name is John'
      },
      expected: {
        operation: 'extract',
        minMemoryCount: 1,
        requiredKeys: ['name']
      },
      metadata: {}
    }

    const extractRun: RunRecord = {
      id: 'run-1',
      taskId: 'task-1',
      taskType: 'atomic',
      status: 'completed',
      output: {
        operation: 'extract',
        memories: [
          { key: 'name', value: 'John', importance: 0.9, timestamp: new Date() },
          { key: 'greeting', value: 'hello', importance: 0.5, timestamp: new Date() }
        ]
      },
      metrics: {
        latency: 500,
        tokens: 60
      },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: 'memory.llm',
        runnerVersion: '1.0.0',
        config: {}
      }
    }

    it('should evaluate successful extraction', async () => {
      const scores = await evaluator.evaluate(extractRun, extractTask)

      expect(scores.length).toBeGreaterThan(0)

      // Memory count
      const countScore = scores.find(s => s.metric === 'memory_count')
      expect(countScore).toBeDefined()
      expect(countScore?.value).toBe(2)

      // Accuracy
      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore).toBeDefined()
      expect(accuracyScore?.value).toBe(1)

      // Average importance
      const importanceScore = scores.find(s => s.metric === 'avg_importance')
      expect(importanceScore).toBeDefined()
      expect(importanceScore?.value).toBe(0.7) // (0.9 + 0.5) / 2

      // Latency
      const latencyScore = scores.find(s => s.metric === 'latency')
      expect(latencyScore).toBeDefined()
      expect(latencyScore?.value).toBe(500)
    })

    it('should detect missing required keys', async () => {
      const runWithoutKey: RunRecord = {
        ...extractRun,
        output: {
          operation: 'extract',
          memories: [
            { key: 'age', value: 30, importance: 0.8 }
          ]
        }
      }

      const scores = await evaluator.evaluate(runWithoutKey, extractTask)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBeLessThan(1)
      expect(accuracyScore?.evidence?.explanation).toContain('Missing required keys')
    })

    it('should check minimum memory count', async () => {
      const taskWithMinCount: AtomicTask = {
        ...extractTask,
        expected: {
          operation: 'extract',
          minMemoryCount: 5
        }
      }

      const scores = await evaluator.evaluate(extractRun, taskWithMinCount)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBeLessThan(1)
      expect(accuracyScore?.evidence?.explanation).toContain('Too few memories')
    })

    it('should check maximum memory count', async () => {
      const taskWithMaxCount: AtomicTask = {
        ...extractTask,
        expected: {
          operation: 'extract',
          maxMemoryCount: 1
        }
      }

      const scores = await evaluator.evaluate(extractRun, taskWithMaxCount)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBeLessThan(1)
      expect(accuracyScore?.evidence?.explanation).toContain('Too many memories')
    })

    it('should check minimum importance', async () => {
      const taskWithMinImportance: AtomicTask = {
        ...extractTask,
        expected: {
          operation: 'extract',
          minImportance: 0.8
        }
      }

      const scores = await evaluator.evaluate(extractRun, taskWithMinImportance)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBeLessThan(1)
      expect(accuracyScore?.evidence?.explanation).toContain('below minimum importance')
    })
  })

  describe('evaluate - retrieve', () => {
    const retrieveTask: AtomicTask = {
      id: 'task-2',
      name: 'Test Memory Retrieve',
      type: 'memory',
      input: {
        operation: 'retrieve',
        message: 'name'
      },
      expected: {
        operation: 'retrieve',
        minMemoryCount: 1
      },
      metadata: {}
    }

    const retrieveRun: RunRecord = {
      id: 'run-2',
      taskId: 'task-2',
      taskType: 'atomic',
      status: 'completed',
      output: {
        operation: 'retrieve',
        memories: [
          { key: 'name', value: 'John', importance: 0.9 }
        ]
      },
      metrics: {
        latency: 100
      },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: 'memory.llm',
        runnerVersion: '1.0.0',
        config: {}
      }
    }

    it('should evaluate successful retrieval', async () => {
      const scores = await evaluator.evaluate(retrieveRun, retrieveTask)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore).toBeDefined()
      expect(accuracyScore?.value).toBe(1)
    })

    it('should detect wrong operation', async () => {
      const runWithWrongOp: RunRecord = {
        ...retrieveRun,
        output: {
          operation: 'extract',
          memories: []
        }
      }

      const scores = await evaluator.evaluate(runWithWrongOp, retrieveTask)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBe(0)
      expect(accuracyScore?.evidence?.explanation).toContain('Wrong operation')
    })
  })

  describe('edge cases', () => {
    it('should handle empty memories', async () => {
      const task: AtomicTask = {
        id: 'task-3',
        name: 'Empty',
        type: 'memory',
        input: { operation: 'extract', message: 'test' },
        metadata: {}
      }

      const run: RunRecord = {
        id: 'run-3',
        taskId: 'task-3',
        taskType: 'atomic',
        status: 'completed',
        output: {
          operation: 'extract',
          memories: []
        },
        metrics: { latency: 100 },
        trace: [],
        startedAt: new Date(),
        completedAt: new Date(),
        provenance: {
          runnerId: 'memory.llm',
          runnerVersion: '1.0.0',
          config: {}
        }
      }

      const scores = await evaluator.evaluate(run, task)

      // Should not have avg_importance score
      expect(scores.find(s => s.metric === 'avg_importance')).toBeUndefined()

      // Should have memory_count
      const countScore = scores.find(s => s.metric === 'memory_count')
      expect(countScore?.value).toBe(0)
    })

    it('should handle failed run', async () => {
      const task: AtomicTask = {
        id: 'task-4',
        name: 'Failed',
        type: 'memory',
        input: { operation: 'extract', message: 'test' },
        metadata: {}
      }

      const failedRun: RunRecord = {
        id: 'run-4',
        taskId: 'task-4',
        taskType: 'atomic',
        status: 'failed',
        output: undefined,
        error: { message: 'Error' },
        metrics: { latency: 100 },
        trace: [],
        startedAt: new Date(),
        provenance: {
          runnerId: 'memory.llm',
          runnerVersion: '1.0.0',
          config: {}
        }
      }

      const scores = await evaluator.evaluate(failedRun, task)

      expect(scores).toHaveLength(1)
      expect(scores[0].metric).toBe('accuracy')
      expect(scores[0].value).toBe(0)
    })
  })
})
