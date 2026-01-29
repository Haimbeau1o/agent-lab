/**
 * IntentMetricsEvaluator 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { IntentMetricsEvaluator } from './intent-metrics-evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'

describe('IntentMetricsEvaluator', () => {
  let evaluator: IntentMetricsEvaluator

  beforeEach(() => {
    evaluator = new IntentMetricsEvaluator()
  })

  describe('metadata', () => {
    it('should have correct id and metrics', () => {
      expect(evaluator.id).toBe('intent.metrics')
      expect(evaluator.metrics).toEqual(['accuracy', 'confidence', 'latency'])
    })
  })

  describe('evaluate', () => {
    const baseTask: AtomicTask = {
      id: 'task-1',
      name: 'Test Intent Recognition',
      type: 'intent',
      input: {
        text: 'Hello there!'
      },
      expected: {
        intent: 'greeting',
        confidence: 0.8
      },
      metadata: {}
    }

    const baseRun: RunRecord = {
      id: 'run-1',
      taskId: 'task-1',
      taskType: 'atomic',
      status: 'completed',
      output: {
        intent: 'greeting',
        confidence: 0.95,
        reasoning: 'User is saying hello'
      },
      metrics: {
        latency: 500,
        tokens: 70,
        cost: 0.00014
      },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: 'intent.llm',
        runnerVersion: '1.0.0',
        config: {}
      }
    }

    it('should evaluate correct intent with all metrics', async () => {
      const scores = await evaluator.evaluate(baseRun, baseTask)

      expect(scores).toHaveLength(6) // accuracy, confidence_threshold, confidence, latency, tokens, cost

      // Accuracy
      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore).toBeDefined()
      expect(accuracyScore?.value).toBe(1)
      expect(accuracyScore?.target).toBe('final')
      expect(accuracyScore?.evidence?.explanation).toContain('correctly identified')

      // Confidence threshold
      const thresholdScore = scores.find(s => s.metric === 'confidence_threshold')
      expect(thresholdScore).toBeDefined()
      expect(thresholdScore?.value).toBe(true)
      expect(thresholdScore?.evidence?.explanation).toContain('meets threshold')

      // Confidence
      const confidenceScore = scores.find(s => s.metric === 'confidence')
      expect(confidenceScore).toBeDefined()
      expect(confidenceScore?.value).toBe(0.95)
      expect(confidenceScore?.target).toBe('final')

      // Latency
      const latencyScore = scores.find(s => s.metric === 'latency')
      expect(latencyScore).toBeDefined()
      expect(latencyScore?.value).toBe(500)
      expect(latencyScore?.target).toBe('global')

      // Tokens
      const tokensScore = scores.find(s => s.metric === 'tokens')
      expect(tokensScore).toBeDefined()
      expect(tokensScore?.value).toBe(70)
    })

    it('should evaluate incorrect intent', async () => {
      const wrongRun: RunRecord = {
        ...baseRun,
        output: {
          intent: 'question', // Wrong intent
          confidence: 0.85
        }
      }

      const scores = await evaluator.evaluate(wrongRun, baseTask)

      const accuracyScore = scores.find(s => s.metric === 'accuracy')
      expect(accuracyScore?.value).toBe(0)
      expect(accuracyScore?.evidence?.explanation).toContain('Expected "greeting" but got "question"')
      expect(accuracyScore?.evidence?.alignment).toEqual({
        expected: 'greeting',
        actual: 'question'
      })
    })

    it('should evaluate confidence below threshold', async () => {
      const lowConfidenceRun: RunRecord = {
        ...baseRun,
        output: {
          intent: 'greeting',
          confidence: 0.7 // Below threshold of 0.8
        }
      }

      const scores = await evaluator.evaluate(lowConfidenceRun, baseTask)

      const thresholdScore = scores.find(s => s.metric === 'confidence_threshold')
      expect(thresholdScore?.value).toBe(false)
      expect(thresholdScore?.evidence?.explanation).toContain('below threshold')
    })

    it('should handle task without expected output', async () => {
      const taskWithoutExpected: AtomicTask = {
        ...baseTask,
        expected: undefined
      }

      const scores = await evaluator.evaluate(baseRun, taskWithoutExpected)

      // Should not have accuracy or confidence_threshold scores
      expect(scores.find(s => s.metric === 'accuracy')).toBeUndefined()
      expect(scores.find(s => s.metric === 'confidence_threshold')).toBeUndefined()

      // Should still have confidence and latency
      expect(scores.find(s => s.metric === 'confidence')).toBeDefined()
      expect(scores.find(s => s.metric === 'latency')).toBeDefined()
    })

    it('should handle task without confidence threshold', async () => {
      const taskWithoutThreshold: AtomicTask = {
        ...baseTask,
        expected: {
          intent: 'greeting'
          // No confidence field
        }
      }

      const scores = await evaluator.evaluate(baseRun, taskWithoutThreshold)

      // Should have accuracy but not confidence_threshold
      expect(scores.find(s => s.metric === 'accuracy')).toBeDefined()
      expect(scores.find(s => s.metric === 'confidence_threshold')).toBeUndefined()
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
      expect(scores[0].metric).toBe('accuracy')
      expect(scores[0].value).toBe(0)
      expect(scores[0].evidence?.explanation).toContain('Execution failed')
    })

    it('should include cost metric when available', async () => {
      const scores = await evaluator.evaluate(baseRun, baseTask)

      const costScore = scores.find(s => s.metric === 'cost')
      expect(costScore).toBeDefined()
      expect(costScore?.value).toBe(0.00014)
      expect(costScore?.target).toBe('global')
    })

    it('should not include cost metric when unavailable', async () => {
      const runWithoutCost: RunRecord = {
        ...baseRun,
        metrics: {
          latency: 500,
          tokens: 70
          // No cost
        }
      }

      const scores = await evaluator.evaluate(runWithoutCost, baseTask)

      expect(scores.find(s => s.metric === 'cost')).toBeUndefined()
    })

    it('should include reasoning in confidence evidence', async () => {
      const scores = await evaluator.evaluate(baseRun, baseTask)

      const confidenceScore = scores.find(s => s.metric === 'confidence')
      expect(confidenceScore?.evidence?.snippets).toContain('User is saying hello')
    })

    it('should handle output without reasoning', async () => {
      const runWithoutReasoning: RunRecord = {
        ...baseRun,
        output: {
          intent: 'greeting',
          confidence: 0.95
          // No reasoning
        }
      }

      const scores = await evaluator.evaluate(runWithoutReasoning, baseTask)

      const confidenceScore = scores.find(s => s.metric === 'confidence')
      expect(confidenceScore?.evidence?.snippets).toBeUndefined()
    })

    it('should throw error for invalid output', async () => {
      const invalidRun: RunRecord = {
        ...baseRun,
        output: {
          // Missing intent field
          confidence: 0.95
        }
      }

      await expect(evaluator.evaluate(invalidRun, baseTask)).rejects.toThrow(
        'Output must include intent field'
      )
    })

    it('should throw error for invalid expected', async () => {
      const invalidTask: AtomicTask = {
        ...baseTask,
        expected: {
          // Missing intent field
          confidence: 0.8
        }
      }

      await expect(evaluator.evaluate(baseRun, invalidTask)).rejects.toThrow(
        'Expected must include intent field'
      )
    })

    it('should set correct evaluatorId and timestamps', async () => {
      const beforeEval = new Date()
      const scores = await evaluator.evaluate(baseRun, baseTask)
      const afterEval = new Date()

      scores.forEach(score => {
        expect(score.evaluatorId).toBe('intent.metrics')
        expect(score.runId).toBe('run-1')
        expect(score.createdAt).toBeInstanceOf(Date)
        expect(score.createdAt.getTime()).toBeGreaterThanOrEqual(beforeEval.getTime())
        expect(score.createdAt.getTime()).toBeLessThanOrEqual(afterEval.getTime())
      })
    })
  })
})
