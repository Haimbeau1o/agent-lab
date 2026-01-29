import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScenarioExecutor } from './scenario-executor.js'
import { RunnerRegistry } from '../registry/runner-registry.js'
import type { ScenarioTask, AtomicTask, RunRecord, Runner } from '../contracts/index.js'

describe('ScenarioExecutor', () => {
  let executor: ScenarioExecutor
  let runnerRegistry: RunnerRegistry

  // Mock Runner for testing
  const createMockRunner = (
    id: string,
    shouldFail = false,
    output: unknown = { result: 'success' }
  ): Runner => ({
    id,
    type: 'test',
    version: '1.0.0',
    execute: vi.fn(async (task: AtomicTask) => {
      const startedAt = new Date()

      if (shouldFail) {
        return {
          id: `run-${task.id}`,
          taskId: task.id,
          taskType: 'atomic' as const,
          status: 'failed' as const,
          error: {
            message: 'Mock execution failed',
            stack: 'Error stack'
          },
          metrics: {
            latency: 100
          },
          trace: [
            {
              timestamp: startedAt,
              level: 'error' as const,
              event: 'execution_failed',
              data: { reason: 'Mock failure' }
            }
          ],
          startedAt,
          completedAt: new Date(),
          provenance: {
            runnerId: id,
            runnerVersion: '1.0.0',
            config: {}
          }
        }
      }

      return {
        id: `run-${task.id}`,
        taskId: task.id,
        taskType: 'atomic' as const,
        status: 'completed' as const,
        output,
        metrics: {
          latency: 100,
          tokens: 50,
          cost: 0.001
        },
        trace: [
          {
            timestamp: startedAt,
            level: 'info' as const,
            event: 'execution_started',
            data: { taskId: task.id }
          },
          {
            timestamp: new Date(),
            level: 'info' as const,
            event: 'execution_completed',
            data: { output }
          }
        ],
        startedAt,
        completedAt: new Date(),
        provenance: {
          runnerId: id,
          runnerVersion: '1.0.0',
          config: {}
        }
      }
    })
  })

  beforeEach(() => {
    runnerRegistry = new RunnerRegistry()
    executor = new ScenarioExecutor()
  })

  describe('execute - 正常流程', () => {
    it('应该成功执行包含 2 个步骤的场景', async () => {
      // Arrange
      const runner1 = createMockRunner('runner-1', false, { intent: 'greeting' })
      const runner2 = createMockRunner('runner-2', false, { response: 'Hello!' })

      runnerRegistry.register(runner1)
      runnerRegistry.register(runner2)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Intent to Response',
        description: 'Recognize intent and generate response',
        steps: [
          {
            id: 'step-1',
            name: 'Recognize Intent',
            type: 'intent',
            input: { text: 'Hello' },
            metadata: {}
          },
          {
            id: 'step-2',
            name: 'Generate Response',
            type: 'dialogue',
            input: { text: 'Hello' },
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' },
        'step-2': { runnerId: 'runner-2' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('completed')
      expect(result.taskType).toBe('scenario')
      expect(result.taskId).toBe('scenario-1')
      expect(result.steps).toHaveLength(2)
      expect(result.steps?.[0].status).toBe('completed')
      expect(result.steps?.[1].status).toBe('completed')
      expect(result.trace.length).toBeGreaterThan(0)
      expect(result.metrics.latency).toBeGreaterThan(0)
    })

    it('应该正确聚合所有步骤的性能指标', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Test Scenario',
        description: 'Test',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          },
          {
            id: 'step-2',
            name: 'Step 2',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' },
        'step-2': { runnerId: 'runner-1' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.metrics.latency).toBeGreaterThanOrEqual(200) // 2 steps * 100ms
      expect(result.metrics.tokens).toBe(100) // 2 steps * 50 tokens
      expect(result.metrics.cost).toBeCloseTo(0.002, 5) // 2 steps * 0.001
    })

    it('应该正确聚合所有步骤的 Trace 事件', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Test Scenario',
        description: 'Test',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.trace.length).toBeGreaterThan(2)

      // 应该包含场景级别的事件
      const scenarioStartEvent = result.trace.find(e => e.event === 'scenario_started')
      expect(scenarioStartEvent).toBeDefined()

      // 应该包含步骤级别的事件（带 step 字段）
      const stepEvents = result.trace.filter(e => e.step === 'step-1')
      expect(stepEvents.length).toBeGreaterThan(0)
    })
  })

  describe('execute - 数据传递', () => {
    it('应该正确传递前一步的输出到下一步', async () => {
      // Arrange
      const runner1 = createMockRunner('runner-1', false, { intent: 'greeting', confidence: 0.95 })
      const runner2 = createMockRunner('runner-2')

      runnerRegistry.register(runner1)
      runnerRegistry.register(runner2)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Data Flow Test',
        description: 'Test data passing between steps',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'intent',
            input: { text: 'Hello' },
            metadata: {}
          },
          {
            id: 'step-2',
            name: 'Step 2',
            type: 'dialogue',
            input: {},
            metadata: {}
          }
        ],
        input_map: {
          'step-2': [
            { from: 'step:step-1:intent', to: 'detected_intent' },
            { from: 'step:step-1:confidence', to: 'confidence' }
          ]
        },
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' },
        'step-2': { runnerId: 'runner-2' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('completed')

      // 验证 runner2 被调用时接收到了正确的输入
      const runner2Execute = runner2.execute as ReturnType<typeof vi.fn>
      expect(runner2Execute).toHaveBeenCalled()

      const step2Input = runner2Execute.mock.calls[0][0].input as Record<string, unknown>
      expect(step2Input.detected_intent).toBe('greeting')
      expect(step2Input.confidence).toBe(0.95)
    })

    it('应该支持从场景初始输入传递数据', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Initial Input Test',
        description: 'Test passing data from scenario input',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {
          'step-1': [
            { from: 'input:userId', to: 'user_id' },
            { from: 'input:message', to: 'text' }
          ]
        },
        metadata: {
          scenarioInput: { userId: '123', message: 'Hello' }
        }
      }

      const config = {
        'step-1': { runnerId: 'runner-1' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('completed')

      const runnerExecute = runner.execute as ReturnType<typeof vi.fn>
      const step1Input = runnerExecute.mock.calls[0][0].input as Record<string, unknown>
      expect(step1Input.user_id).toBe('123')
      expect(step1Input.text).toBe('Hello')
    })
  })

  describe('execute - 错误处理', () => {
    it('应该在步骤失败时标记整个场景为失败', async () => {
      // Arrange
      const runner1 = createMockRunner('runner-1')
      const runner2 = createMockRunner('runner-2', true) // 第二步失败

      runnerRegistry.register(runner1)
      runnerRegistry.register(runner2)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Failure Test',
        description: 'Test failure handling',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          },
          {
            id: 'step-2',
            name: 'Step 2',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' },
        'step-2': { runnerId: 'runner-2' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.error?.step).toBe('step-2')
      expect(result.error?.message).toContain('Mock execution failed')
      expect(result.steps).toHaveLength(2)
      expect(result.steps?.[0].status).toBe('completed')
      expect(result.steps?.[1].status).toBe('failed')
    })

    it('应该在 Runner 不存在时返回失败状态', async () => {
      // Arrange
      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Missing Runner Test',
        description: 'Test missing runner',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'non-existent-runner' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Runner not found: non-existent-runner')
    })

    it('应该在配置缺失时返回失败状态', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Missing Config Test',
        description: 'Test missing config',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {} // 缺少 step-1 的配置

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Missing config for step: step-1')
    })
  })

  describe('execute - Provenance', () => {
    it('应该记录场景级别的 Provenance 信息', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Provenance Test',
        description: 'Test provenance recording',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1', temperature: 0.7 }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.provenance).toBeDefined()
      expect(result.provenance.runnerId).toBe('scenario-executor')
      expect(result.provenance.runnerVersion).toBe('1.0.0')
      expect(result.provenance.config).toEqual(config)
    })
  })

  describe('execute - 边界条件', () => {
    it('应该处理空步骤的场景', async () => {
      // Arrange
      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Empty Scenario',
        description: 'Scenario with no steps',
        steps: [],
        input_map: {},
        metadata: {}
      }

      const config = {}

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('completed')
      expect(result.steps).toHaveLength(0)
      expect(result.metrics.latency).toBeGreaterThanOrEqual(0)
    })

    it('应该处理单步骤的场景', async () => {
      // Arrange
      const runner = createMockRunner('runner-1')
      runnerRegistry.register(runner)

      const scenario: ScenarioTask = {
        id: 'scenario-1',
        name: 'Single Step Scenario',
        description: 'Scenario with one step',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'test',
            input: {},
            metadata: {}
          }
        ],
        input_map: {},
        metadata: {}
      }

      const config = {
        'step-1': { runnerId: 'runner-1' }
      }

      // Act
      const result = await executor.execute(scenario, runnerRegistry, config)

      // Assert
      expect(result.status).toBe('completed')
      expect(result.steps).toHaveLength(1)
    })
  })
})
