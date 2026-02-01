/**
 * ScoreRecord Contract - 评分记录契约
 *
 * 记录评估结果，提供可解释性
 */

/**
 * ScoreRecord - 评分记录
 * 记录单个指标的评估结果
 */
export interface ScoreRecord {
  // 基本信息
  id: string
  runId: string                 // 关联的 RunRecord ID

  // 指标
  metric: string                // 指标名称（如 "accuracy", "latency"）
  value: number | boolean | string  // 指标值

  // 评估目标
  target: 'final' | 'global' | `step:${string}`
  // - final: 评估最终输出
  // - global: 评估整体过程
  // - step:xxx: 评估特定步骤

  // 证据（可解释性）
  evidence?: {
    explanation?: string        // 评分解释
    snippets?: string[]         // 相关片段
    alignment?: Record<string, unknown>  // 对齐数据
    reportRefs?: string[]       // 关联的报告 ID 列表
  }

  // 评估器信息
  evaluatorId: string

  // 时间戳
  createdAt: Date
}
