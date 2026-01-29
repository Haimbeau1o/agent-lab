import type {
  ScenarioTask,
  AtomicTask,
  RunRecord,
  TraceEvent,
  StepSummary
} from '../contracts/index.js'
import type { RunnerRegistry } from '../registry/runner-registry.js'

/**
 * ScenarioExecutor - 场景执行器
 *
 * 负责执行 ScenarioTask，包括：
 * 1. 按顺序执行每个 AtomicTask
 * 2. 根据 input_map 传递数据
 * 3. 记录每步的 Trace
 * 4. 任一步失败则整体失败
 * 5. 返回包含所有步骤的 RunRecord
 */
export class ScenarioExecutor {
  private readonly id = 'scenario-executor'
  private readonly version = '1.0.0'

  /**
   * 执行场景任务
   */
  async execute(
    scenario: ScenarioTask,
    runnerRegistry: RunnerRegistry,
    config: Record<string, { runnerId: string; [key: string]: unknown }>
  ): Promise<RunRecord> {
    const startedAt = new Date()
    const trace: TraceEvent[] = []
    const steps: StepSummary[] = []

    // 记录场景开始
    trace.push({
      timestamp: new Date(),
      level: 'info',
      event: 'scenario_started',
      data: {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        stepCount: scenario.steps.length
      }
    })

    // 累计性能指标
    let totalLatency = 0
    let totalTokens = 0
    let totalCost = 0

    // 存储每步的输出，用于数据传递
    const stepOutputs: Record<string, unknown> = {}

    // 场景初始输入（从 scenario.metadata 中获取）
    const scenarioInput = scenario.metadata?.scenarioInput as Record<string, unknown> | undefined

    try {
      // 按顺序执行每个步骤
      for (const step of scenario.steps) {
        const stepStartTime = Date.now()

        // 验证配置
        const stepConfig = config[step.id]
        if (!stepConfig) {
          throw new Error(`Missing config for step: ${step.id}`)
        }

        const { runnerId, ...runnerConfig } = stepConfig

        // 获取 Runner
        const runner = runnerRegistry.get(runnerId)
        if (!runner) {
          throw new Error(`Runner not found: ${runnerId}`)
        }

        // 记录步骤开始
        trace.push({
          timestamp: new Date(),
          level: 'info',
          step: step.id,
          event: 'step_started',
          data: {
            stepId: step.id,
            stepName: step.name,
            runnerId
          }
        })

        // 应用数据传递（input_map）
        const processedTask = this.applyInputMap(
          step,
          scenario.input_map,
          stepOutputs,
          scenarioInput
        )

        // 执行步骤
        const stepResult = await runner.execute(processedTask, runnerConfig)

        // 记录步骤输出
        stepOutputs[step.id] = stepResult.output

        // 累计性能指标
        totalLatency += stepResult.metrics.latency
        totalTokens += stepResult.metrics.tokens || 0
        totalCost += stepResult.metrics.cost || 0

        // 合并步骤的 Trace（添加 step 字段）
        for (const event of stepResult.trace) {
          trace.push({
            ...event,
            step: step.id
          })
        }

        // 检查步骤是否失败
        if (stepResult.status === 'failed') {
          // 记录步骤失败
          steps.push({
            stepId: step.id,
            stepName: step.name,
            status: 'failed',
            latency: Date.now() - stepStartTime,
            error: stepResult.error?.message
          })

          trace.push({
            timestamp: new Date(),
            level: 'error',
            step: step.id,
            event: 'step_failed',
            data: {
              stepId: step.id,
              error: stepResult.error?.message
            }
          })

          // 场景失败
          trace.push({
            timestamp: new Date(),
            level: 'error',
            event: 'scenario_failed',
            data: {
              failedStep: step.id,
              error: stepResult.error?.message
            }
          })

          return {
            id: `run-${scenario.id}-${Date.now()}`,
            taskId: scenario.id,
            taskType: 'scenario',
            status: 'failed',
            error: {
              message: stepResult.error?.message || 'Step execution failed',
              step: step.id,
              stack: stepResult.error?.stack
            },
            metrics: {
              latency: totalLatency,
              tokens: totalTokens,
              cost: totalCost
            },
            trace,
            steps,
            startedAt,
            completedAt: new Date(),
            provenance: {
              runnerId: this.id,
              runnerVersion: this.version,
              config
            }
          }
        }

        // 记录步骤成功
        steps.push({
          stepId: step.id,
          stepName: step.name,
          status: 'completed',
          latency: Date.now() - stepStartTime,
          output: stepResult.output
        })

        trace.push({
          timestamp: new Date(),
          level: 'info',
          step: step.id,
          event: 'step_completed',
          data: {
            stepId: step.id,
            latency: Date.now() - stepStartTime
          }
        })
      }

      // 场景成功
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'scenario_completed',
        data: {
          totalSteps: scenario.steps.length,
          totalLatency
        }
      })

      // 场景的输出是最后一步的输出
      const finalOutput = scenario.steps.length > 0
        ? stepOutputs[scenario.steps[scenario.steps.length - 1].id]
        : undefined

      return {
        id: `run-${scenario.id}-${Date.now()}`,
        taskId: scenario.id,
        taskType: 'scenario',
        status: 'completed',
        output: finalOutput,
        metrics: {
          latency: totalLatency,
          tokens: totalTokens,
          cost: totalCost
        },
        trace,
        steps,
        startedAt,
        completedAt: new Date(),
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config
        }
      }
    } catch (error) {
      // 捕获执行过程中的异常
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined

      trace.push({
        timestamp: new Date(),
        level: 'error',
        event: 'scenario_error',
        data: {
          error: errorMessage,
          stack: errorStack
        }
      })

      return {
        id: `run-${scenario.id}-${Date.now()}`,
        taskId: scenario.id,
        taskType: 'scenario',
        status: 'failed',
        error: {
          message: errorMessage,
          stack: errorStack
        },
        metrics: {
          latency: totalLatency,
          tokens: totalTokens,
          cost: totalCost
        },
        trace,
        steps,
        startedAt,
        completedAt: new Date(),
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config
        }
      }
    }
  }

  /**
   * 应用 input_map，将前面步骤的输出传递到当前步骤的输入
   */
  private applyInputMap(
    step: AtomicTask,
    inputMap: ScenarioTask['input_map'],
    stepOutputs: Record<string, unknown>,
    scenarioInput?: Record<string, unknown>
  ): AtomicTask {
    const mappings = inputMap[step.id]
    if (!mappings || mappings.length === 0) {
      return step
    }

    // 创建新的输入对象（不可变）
    const newInput = { ...(step.input as Record<string, unknown>) }

    for (const mapping of mappings) {
      const { from, to } = mapping

      let value: unknown

      if (from.startsWith('step:')) {
        // 从前面步骤的输出获取数据
        // 格式: "step:step-1:output.intent"
        const parts = from.split(':')
        const sourceStepId = parts[1]
        const path = parts.slice(2).join(':')

        const sourceOutput = stepOutputs[sourceStepId]
        value = this.getValueByPath(sourceOutput, path)
      } else if (from.startsWith('input:')) {
        // 从场景初始输入获取数据
        // 格式: "input:userId"
        const fieldName = from.substring(6) // 移除 "input:" 前缀
        value = scenarioInput?.[fieldName]
      } else {
        // 不支持的格式
        continue
      }

      // 设置目标字段
      this.setValueByPath(newInput, to, value)
    }

    return {
      ...step,
      input: newInput
    }
  }

  /**
   * 根据路径获取对象的值
   * 例如: "output.intent" -> obj.output.intent
   */
  private getValueByPath(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') {
      return undefined
    }

    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 根据路径设置对象的值
   * 例如: "input.detected_intent" -> obj.input.detected_intent = value
   */
  private setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }

    current[parts[parts.length - 1]] = value
  }
}
