/**
 * EvaluatorRegistry 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EvaluatorRegistry } from './evaluator-registry.js'
import type { Evaluator } from '../contracts/evaluator.js'
import type { RunRecord, AtomicTask, ScoreRecord } from '../contracts/index.js'

// Mock Evaluator for testing
class MockEvaluator implements Evaluator {
  constructor(
    public id: string,
    public metrics: string[] = ['accuracy', 'latency']
  ) {}

  async evaluate(run: RunRecord, task: AtomicTask): Promise<ScoreRecord[]> {
    return [
      {
        id: 'mock-score-id',
        runId: run.id,
        metric: 'accuracy',
        value: 0.95,
        target: 'final',
        evaluatorId: this.id,
        createdAt: new Date()
      }
    ]
  }
}

describe('EvaluatorRegistry', () => {
  let registry: EvaluatorRegistry

  beforeEach(() => {
    registry = new EvaluatorRegistry()
  })

  describe('register', () => {
    it('should register an evaluator successfully', () => {
      const evaluator = new MockEvaluator('test.evaluator')

      expect(() => registry.register(evaluator)).not.toThrow()
      expect(registry.has('test.evaluator')).toBe(true)
    })

    it('should throw error when registering duplicate id', () => {
      const evaluator1 = new MockEvaluator('test.evaluator')
      const evaluator2 = new MockEvaluator('test.evaluator')

      registry.register(evaluator1)

      expect(() => registry.register(evaluator2)).toThrow(
        'Evaluator with id "test.evaluator" is already registered'
      )
    })
  })

  describe('get', () => {
    it('should retrieve registered evaluator by id', () => {
      const evaluator = new MockEvaluator('test.evaluator')
      registry.register(evaluator)

      const retrieved = registry.get('test.evaluator')

      expect(retrieved).toBe(evaluator)
      expect(retrieved.id).toBe('test.evaluator')
    })

    it('should throw error when getting non-existent evaluator', () => {
      expect(() => registry.get('non-existent')).toThrow(
        'No evaluator registered with id "non-existent"'
      )
    })
  })

  describe('list', () => {
    it('should return empty array when no evaluators registered', () => {
      const evaluators = registry.list()

      expect(evaluators).toEqual([])
      expect(evaluators.length).toBe(0)
    })

    it('should return all registered evaluators', () => {
      const evaluator1 = new MockEvaluator('test.evaluator1')
      const evaluator2 = new MockEvaluator('test.evaluator2')

      registry.register(evaluator1)
      registry.register(evaluator2)

      const evaluators = registry.list()

      expect(evaluators.length).toBe(2)
      expect(evaluators).toContain(evaluator1)
      expect(evaluators).toContain(evaluator2)
    })

    it('should return immutable copy (not affect registry)', () => {
      const evaluator = new MockEvaluator('test.evaluator')
      registry.register(evaluator)

      const evaluators = registry.list()
      evaluators.pop()

      expect(registry.size()).toBe(1)
    })
  })

  describe('has', () => {
    it('should return true for registered id', () => {
      const evaluator = new MockEvaluator('test.evaluator')
      registry.register(evaluator)

      expect(registry.has('test.evaluator')).toBe(true)
    })

    it('should return false for non-existent id', () => {
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0)
    })

    it('should return correct count after registrations', () => {
      const evaluator1 = new MockEvaluator('test.evaluator1')
      const evaluator2 = new MockEvaluator('test.evaluator2')

      registry.register(evaluator1)
      expect(registry.size()).toBe(1)

      registry.register(evaluator2)
      expect(registry.size()).toBe(2)
    })
  })
})
