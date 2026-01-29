/**
 * RunRecord Contract - 执行记录契约
 *
 * 记录任务执行的完整过程
 * Trace 是一等公民，必须字段
 */

/**
 * TraceEvent - 追踪事件
 * 记录执行过程中的每一个关键步骤
 */
export interface TraceEvent {
  timestamp: Date
  level: 'info' | 'debug' | 'warn' | 'error'
  step?: string                 // 所属步骤（Scenario 专用）
  event: string                 // 事件名称
  data?: unknown                // 事件数据
}

/**
 * StepSummary - 步骤摘要
 * 用于 ScenarioTask 的步骤执行摘要
 */
export interface StepSummary {
  stepId: string
  stepName: string
  status: 'completed' | 'failed' | 'skipped'
  latency: number
  output?: unknown
  error?: string
}

/**
 * RunRecord - 执行记录
 * 记录任务执行的完整过程和结果
 */
export interface RunRecord {
  // 基本信息
  id: string
  taskId: string
  taskType: 'atomic' | 'scenario'

  // 执行状态
  status: 'pending' | 'running' | 'completed' | 'failed'

  // 结果
  output?: unknown
  error?: {
    message: string
    step?: string               // 失败的步骤（Scenario 专用）
    stack?: string
  }

  // 性能指标
  metrics: {
    latency: number             // 执行耗时（毫秒）
    tokens?: number             // Token 消耗
    cost?: number               // 成本（美元）
  }

  // Trace（一等公民，必须字段）
  trace: TraceEvent[]

  // Scenario 专用
  steps?: StepSummary[]         // 步骤摘要

  // 时间戳
  startedAt: Date
  completedAt?: Date

  // 可复现性保证
  provenance: {
    runnerId: string            // 使用的 Runner ID
    runnerVersion: string       // Runner 版本
    config: Record<string, unknown>  // 运行时配置
  }
}
