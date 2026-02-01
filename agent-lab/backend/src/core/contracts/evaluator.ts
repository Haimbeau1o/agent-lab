/**
 * Evaluator Interface - 评估器接口
 *
 * 所有能力模块的评估器必须实现此接口
 * 负责对 RunRecord 进行评估并返回结构化的 ScoreRecord
 */

import type { RunRecord } from './run-record.js'
import type { AtomicTask } from './task.js'
import type { ScoreRecord } from './score-record.js'
import type { ReportRecord } from './report.js'

/**
 * Evaluator - 评估器接口
 * 负责评估 RunRecord 并返回 ScoreRecord[]
 */
export interface Evaluator {
  id: string                    // Evaluator 唯一标识（如 "intent.metrics"）
  metrics: string[]             // 支持的指标列表（如 ["accuracy", "latency"]）

  /**
   * 评估执行记录
   * @param run - 执行记录
   * @param task - 原子任务（包含 expected 用于对比）
   * @returns ScoreRecord[] - 评分记录数组（每个指标一条记录）
   */
  evaluate(
    run: RunRecord,
    task: AtomicTask,
    reports?: ReportRecord[]
  ): Promise<ScoreRecord[]>
}
