/**
 * DialogueMetricsEvaluator 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DialogueMetricsEvaluator } from './dialogue-metrics-evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('DialogueMetricsEvaluator', () => {
  let evaluator: DialogueMetricsEvaluator

  beforeEach(() => {
    evaluator = new DialogueMetricsEvaluator()
  })

  describe('metadata', () => {
    it('should have correct id and metrics', () => {
      expect(evaluator.id).toBe('dialogue.metrics')
      expect(evaluator.metrics).toEqual(['relevance', 'length', 'latency'])
    })
  })

  describe('evaluate', () => {
    const baseTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Dialogue',
      type: 'dialogue',
      input: {
        message: 'Tell me about AI'
      },
      expected: {
        responseContains: ['artificial', 'intelligence'],
        minResponseLength: 50
      },
      metadata: {}
    }

    const baseRun: RunRecord = {
      id: 'run-1',
      taskId: 'task-1',
      taskType: 'atomic',
      status: 'completed',
      output: {
        response: 'Artificial Intelligence (AI) is a fascinating field of computer science.',
        history: [
          { role: 'user', content: 'Tell me about AI' },
          { role: 'assistant', content: 'Artificial Intelligence (AI) is a fascinating field of computer science.' }
        ]
      },
      metrics: {
        latency: 400,
        tokens: 50,
        cost: 0.0001
      },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: 'dialogue.llm',
        runnerVersion: '1.0.0',
        config: {}
      }
    }

    it('should evaluate successful dialogue with all metrics', async () => {
      const scores = await evaluator.evaluate(baseRun, baseTask)

      expect(scores.length).toBeGreaterThan(0)

      // Relevance
      const relevanceScore = scores.find(s => s.metric === 'relevance')
      expect(relevanceScore).toBeDefined()
      expect(relevanceScore?.value).toBe(1)
      expect(relevanceScore?.target).toBe('final')

      // Response length
      const lengthScore = scores.find(s => s.metric === 'response_length')
      expect(lengthScore).toBeDefined()
      expect(lengthScore?.value).toBeGreaterThan(0)

      // History length
      const historyScore = scores.find(s => s.metric === 'history_length')
      expect(historyScore).toBeDefined()
      expect(historyScore?.value).toBe(2)

      // Latency
      const latencyScore = scores.find(s => s.metric === 'latency')
      expect(latencyScore).toBeDefined()
      expect(latencyScore?.value).toBe(400)
    })

    it('should detect missing required keywords', async () => {
      const runWithoutKeywords: RunRecord = {
        ...baseRun,
        output: {
          response: 'This is a response without the required keywords.',
          history: []
        }
      }

      const scores = await evaluator.evaluate(runWithoutKeywords, baseTask)

      const relevanceScore = scores.find(s => s.metric === 'relevance')
      expect(relevanceScore?.value).toBeLessThan(1)
      expect(relevanceScore?.evidence?.explanation).toContain('Missing keywords')
    })

    it('should detect forbidden keywords', async () => {
      const taskWithForbidden: AtomicTask = {
        ...baseTask,
        expected: {
          responseNotContains: ['bad', 'wrong']
        }
      }

      const runWithForbidden: RunRecord = {
        ...baseRun,
        output: {
          response: 'This is a bad response with wrong information.',
          history: []
        }
      }

      const scores = await evaluator.evaluate(runWithForbidden, taskWithForbidden)

      const relevanceScore = scores.find(s => s.metric === 'relevance')
      expect(relevanceScore?.value).toBeLessThan(1)
      expect(relevanceScore?.evidence?.explanation).toContain('forbidden keywords')
    })

    it('should check minimum response length', async () => {
      const taskWithMinLength: AtomicTask = {
        ...baseTask,
        expected: {
          minResponseLength: 100
        }
      }

      const runWithShortResponse: RunRecord = {
        ...baseRun,
        output: {
          response: 'Short response.',
          history: []
        }
      }

      const scores = await evaluator.evaluate(runWithShortResponse, taskWithMinLength)

      const relevanceScore = scores.find(s => s.metric === 'relevance')
      expect(relevanceScore?.value).toBeLessThan(1)
      expect(relevanceScore?.evidence?.explanation).toContain('too short')
    })

    it('should check maximum response length', async () => {
      const taskWithMaxLength: AtomicTask = {
        ...baseTask,
        expected: {
          maxResponseLength: 20
        }
      }

      const runWithLongResponse: RunRecord = {
        ...baseRun,
        output: {
          response: 'This is a very long response that exceeds the maximum length.',
          history: []
        }
      }

      const scores = await evaluator.evaluate(runWithLongResponse, taskWithMaxLength)

      const relevanceScore = scores.find(s => s.metric === 'relevance')
      expect(relevanceScore?.value).toBeLessThan(1)
      expect(relevanceScore?.evidence?.explanation).toContain('too long')
    })

    it('should handle task without expected output', async () => {
      const taskWithoutExpected: AtomicTask = {
        ...baseTask,
        expected: undefined
      }

      const scores = await evaluator.evaluate(baseRun, taskWithoutExpected)

      // Should not have relevance score
      expect(scores.find(s => s.metric === 'relevance')).toBeUndefined()

      // Should still have other metrics
      expect(scores.find(s => s.metric === 'response_length')).toBeDefined()
      expect(scores.find(s => s.metric === 'latency')).toBeDefined()
    })

    it('should handle failed run', async () => {
      const failedRun: RunRecord = {
        ...baseRun,
        status: 'failed',
        output: undefined,
        error: {
          message: 'LLM API error'
        }
      }

      const scores = await evaluator.evaluate(failedRun, baseTask)

      expect(scores).toHaveLength(1)
      expect(scores[0].metric).toBe('relevance')
      expect(scores[0].value).toBe(0)
      expect(scores[0].evidence?.explanation).toContain('Execution failed')
    })
  })
})
