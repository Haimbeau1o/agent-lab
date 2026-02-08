/**
 * RunnerRegistry 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RunnerRegistry } from './runner-registry.js'
import type { Runner } from '../contracts/runner.js'
import type { AtomicTask, RunRecord } from '../contracts/index.js'

class MockRunner implements Runner {
  constructor(
    public id: string,
    public type: string,
    public version: string = '1.0.0'
  ) {}

  async execute(task: AtomicTask, _config: unknown): Promise<RunRecord> {
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
      expect(registry.has('test.runner')).toBe(true)
      expect(registry.size()).toBe(1)
    })

    it('should throw error when registering duplicate id', () => {
      const runner1 = new MockRunner('test.runner', 'test')
      const runner2 = new MockRunner('test.runner', 'test2')

      registry.register(runner1)

      expect(() => registry.register(runner2)).toThrow(
        'Runner with ID "test.runner" is already registered.'
      )
    })
  })

  describe('get', () => {
    it('should retrieve registered runner by id', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      const retrieved = registry.get('test.runner')

      expect(retrieved).toBe(runner)
      expect(retrieved?.id).toBe('test.runner')
    })

    it('should return null when runner id does not exist', () => {
      expect(registry.get('non-existent')).toBeNull()
    })
  })

  describe('listAll', () => {
    it('should return empty array when no runners registered', () => {
      const runners = registry.listAll()

      expect(runners).toEqual([])
      expect(runners.length).toBe(0)
    })

    it('should return all registered runners', () => {
      const runner1 = new MockRunner('test.runner1', 'test1')
      const runner2 = new MockRunner('test.runner2', 'test2')

      registry.register(runner1)
      registry.register(runner2)

      const runners = registry.listAll()

      expect(runners.length).toBe(2)
      expect(runners).toContain(runner1)
      expect(runners).toContain(runner2)
    })

    it('should return immutable copy (not affect registry)', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      const runners = registry.listAll()
      runners.pop()

      expect(registry.size()).toBe(1)
    })
  })

  describe('listByType', () => {
    it('should return runners with the same type', () => {
      const runner1 = new MockRunner('test.runner1', 'intent')
      const runner2 = new MockRunner('test.runner2', 'intent')
      const runner3 = new MockRunner('test.runner3', 'dialogue')

      registry.register(runner1)
      registry.register(runner2)
      registry.register(runner3)

      const runners = registry.listByType('intent')

      expect(runners).toHaveLength(2)
      expect(runners).toContain(runner1)
      expect(runners).toContain(runner2)
    })
  })

  describe('has', () => {
    it('should return true for registered id', () => {
      const runner = new MockRunner('test.runner', 'test')
      registry.register(runner)

      expect(registry.has('test.runner')).toBe(true)
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
      const runner1 = new MockRunner('test.runner1', 'test1')
      const runner2 = new MockRunner('test.runner2', 'test2')

      registry.register(runner1)
      expect(registry.size()).toBe(1)

      registry.register(runner2)
      expect(registry.size()).toBe(2)
    })
  })
})
