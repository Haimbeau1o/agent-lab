/**
 * Task Contract - 任务契约
 *
 * 系统只认两种任务：AtomicTask 和 ScenarioTask
 * 这些接口定义了任务的核心结构，不包含任何业务逻辑
 */

/**
 * AtomicTask - 原子任务
 * 用于评测单一能力
 */
export interface AtomicTask {
  // 核心字段（不可变）
  id: string                    // 任务唯一标识
  name: string                  // 任务名称
  type: string                  // 能力类型（如 "intent", "dialogue"）

  // 输入输出
  input: unknown                // 任务输入（类型由模块定义）
  expected?: unknown            // 期望输出（用于评估）

  // 上下文
  context?: Record<string, unknown>  // 额外上下文信息

  // 元数据
  metadata: {
    tags?: string[]             // 标签（用于分类）
    priority?: number           // 优先级
    timeout?: number            // 超时时间（毫秒）
  }

  // 扩展点（模块自定义字段必须放这里）
  extensions?: Record<string, unknown>
}

/**
 * ScenarioTask - 场景任务
 * 用于评测多能力组合链路
 */
export interface ScenarioTask {
  // 基本信息
  id: string
  name: string
  description: string

  // 步骤定义
  steps: AtomicTask[]           // 按顺序执行的原子任务

  // 数据流定义（显式声明步骤间的数据传递）
  input_map: {
    [stepName: string]: {
      from: string              // 数据来源："step:previous" 或 "input:field"
      to: string                // 目标字段
    }[]
  }

  // 元数据
  metadata: Record<string, unknown>
}
