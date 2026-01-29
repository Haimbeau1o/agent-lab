/**
 * Runner Interface - 执行器接口
 *
 * 所有能力模块的执行器必须实现此接口
 * Core Engine 通过此接口调用具体实现，保持通用性
 */

import type { AtomicTask } from './task.js'
import type { RunRecord } from './run-record.js'

/**
 * Runner - 执行器接口
 * 负责执行 AtomicTask 并返回 RunRecord
 */
export interface Runner {
  id: string                    // Runner 唯一标识（如 "intent.llm"）
  type: string                  // 能力类型（如 "intent"）
  version: string               // 版本号（如 "1.0.0"）

  /**
   * 执行任务
   * @param task - 原子任务
   * @param config - 运行时配置（由模块定义）
   * @returns RunRecord - 包含完整 trace 的执行记录
   */
  execute(
    task: AtomicTask,
    config: unknown
  ): Promise<RunRecord>
}
