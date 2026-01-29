/**
 * RunnerRegistry 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RunnerRegistry } from './runner-registry.js'
import type { Runner } from '../contracts/runner.js'
import type { AtomicTask, RunRecord } from '../contracts/index.js'

// Mock Runner for testing
class MockRunner implements Runner {
  constructor(
    public id: string,
    public type: string,
    public version: string = '1.0.0'
  ) {}

  async execute(task: AtomicTask, config: unknown): Promise<RunRecord> {
    return {
      id: 'mock-run-id',
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: { result: 'mock' },
      metrics: { latency: 100 },
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

describe('RunnerRegistry', () => {
  let registry: RunnerRegistry

  beforeEach(() => {
    registry = new RunnerRegistry()
  })

  describe('register', () => {
    it('should register a runner successfully', () => {
      const runner = new MockRunner('test.runner', 'test')

      expect(() => registry.register(runner)).not.toThrow()
      expect(registry.has('test')).toBe(true)
    })

    it('should throw error when registering duplicate type', () => {
      const runner1 = new MockRunner('test.runner1', 'test')
      const runner2 = new MockRunner('test.runner2', 'test')

      registry.register(runner1)

      expect(() => registry.register(runner2)).toThrow(
        'Runner with type "test" is already registered'
      )
    })
  })

  describe('get', () => {
    it('should retrieve registered runner by type', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      const retrieved = registry.get('test')

      expect(retrieved).toBe(runner)
      expect(retrieved.id).toBe('test.runner')
    })

    it('should throw error when getting non-existent runner', () => {
      expect(() => registry.get('non-existent')).toThrow(
        'No runner registered for type "non-existent"'
      )
    })
  })

  describe('list', () => {
    it('should return empty array when no runners registered', () => {
      const runners = registry.list()

      expect(runners).toEqual([])
      expect(runners.length).toBe(0)
    })

    it('should return all registered runners', () => {
      const runner1 = new MockRunner('test.runner1', 'test1')
      const runner2 = new MockRunner('test.runner2', 'test2')

      registry.register(runner1)
      registry.register(runner2)

      const runners = registry.list()

      expect(runners.length).toBe(2)
      expect(runners).toContain(runner1)
      expect(runners).toContain(runner2)
    })

    it('should return immutable copy (not affect registry)', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      const runners = registry.list()
      runners.pop()

      expect(registry.size()).toBe(1)
    })
  })

  describe('has', () => {
    it('should return true for registered type', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      expect(registry.has('test')).toBe(true)
    })

    it('should return false for non-existent type', () => {
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0)
    })

    it('should return correct count after registrations', () => {
      const runner1 = new MockRunner('test.runner1', 'test1')
      const runner2 = new MockRunner('test.runner2', 'test2')

      registry.register(runner1)
      expect(registry.size()).toBe(1)

      registry.register(runner2)
      expect(registry.size()).toBe(2)
    })
  })
})
