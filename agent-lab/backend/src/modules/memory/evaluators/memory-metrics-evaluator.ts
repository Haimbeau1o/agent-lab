/**
 * MemoryMetricsEvaluator - 记忆管理指标评估器
 */

import type { Evaluator } from '../../../core/contracts/evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { ScoreRecord } from '../../../core/contracts/score-record.js'
import { randomUUID } from 'crypto'
import type { MemoryOutput } from '../runners/memory-llm-runner.js'

/**
 * Memory 期望输出
 */
export interface MemoryExpected {
  operation: 'extract' | 'retrieve'
  minMemoryCount?: number                // 最小记忆数量
  maxMemoryCount?: number                // 最大记忆数量
  requiredKeys?: string[]                // 必须包含的 key
  minImportance?: number                 // 最小重要性
}

/**
 * MemoryMetricsEvaluator - 记忆管理指标评估器
 */
export class MemoryMetricsEvaluator implements Evaluator {
  readonly id = 'memory.metrics'
  readonly metrics = ['accuracy', 'memory_count', 'latency']

  async evaluate(
    run: RunRecord,
    task: AtomicTask
  ): Promise<ScoreRecord[]> {
    const scores: ScoreRecord[] = []
    const createdAt = new Date()

    // 如果执行失败，返回失败的评分
    if (run.status === 'failed') {
      return [
        {
          id: randomUUID(),
          runId: run.id,
          metric: 'accuracy',
          value: 0,
          target: 'final',
          evidence: {
            explanation: `Execution failed: ${run.error?.message}`
          },
          evaluatorId: this.id,
          createdAt
        }
      ]
    }

    // 验证输出
    const output = this.validateOutput(run.output)

    // 1. Memory Count - 记忆数量
    scores.push({
      id: randomUUID(),
      runId: run.id,
      metric: 'memory_count',
      value: output.memories.length,
      target: 'final',
      evidence: {
        explanation: `${output.operation === 'extract' ? 'Extracted' : 'Retrieved'} ${output.memories.length} memories`
      },
      evaluatorId: this.id,
      createdAt
    })

    // 2. Accuracy - 准确性（如果有期望输出）
    if (task.expected) {
      const expected = this.validateExpected(task.expected)
      const accuracyScore = this.calculateAccuracy(output, expected)

      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'accuracy',
        value: accuracyScore.score,
        target: 'final',
        evidence: {
          explanation: accuracyScore.explanation,
          snippets: accuracyScore.snippets
        },
        evaluatorId: this.id,
        createdAt
      })
    }

    // 3. Average Importance - 平均重要性
    if (output.memories.length > 0) {
      const avgImportance = output.memories.reduce(
        (sum, m) => sum + (m.importance ?? 0),
        0
      ) / output.memories.length

      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'avg_importance',
        value: avgImportance,
        target: 'final',
        evidence: {
          explanation: `Average importance: ${avgImportance.toFixed(2)}`
        },
        evaluatorId: this.id,
        createdAt
      })
    }

    // 4. Latency - 执行耗时
    scores.push({
      id: randomUUID(),
      runId: run.id,
      metric: 'latency',
      value: run.metrics.latency,
      target: 'global',
      evidence: {
        explanation: `Execution took ${run.metrics.latency}ms`
      },
      evaluatorId: this.id,
      createdAt
    })

    // 5. Token Usage - Token 消耗（如果有）
    if (run.metrics.tokens !== undefined) {
      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'tokens',
        value: run.metrics.tokens,
        target: 'global',
        evidence: {
          explanation: `Used ${run.metrics.tokens} tokens`
        },
        evaluatorId: this.id,
        createdAt
      })
    }

    // 6. Cost - 成本（如果有）
    if (run.metrics.cost !== undefined) {
      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'cost',
        value: run.metrics.cost,
        target: 'global',
        evidence: {
          explanation: `Cost: $${run.metrics.cost.toFixed(4)}`
        },
        evaluatorId: this.id,
        createdAt
      })
    }

    return scores
  }

  /**
   * 计算准确性
   */
  private calculateAccuracy(
    output: MemoryOutput,
    expected: MemoryExpected
  ): { score: number; explanation: string; snippets?: string[] } {
    const issues: string[] = []
    const successes: string[] = []
    let score = 1.0

    // 检查操作类型
    if (output.operation !== expected.operation) {
      score = 0
      issues.push(`Wrong operation: expected ${expected.operation}, got ${output.operation}`)
      return {
        score,
        explanation: issues.join('; '),
        snippets: issues
      }
    }

    // 检查记忆数量
    if (expected.minMemoryCount !== undefined) {
      if (output.memories.length < expected.minMemoryCount) {
        score -= 0.3
        issues.push(`Too few memories: ${output.memories.length} < ${expected.minMemoryCount}`)
      } else {
        successes.push(`Meets minimum memory count: ${output.memories.length} >= ${expected.minMemoryCount}`)
      }
    }

    if (expected.maxMemoryCount !== undefined) {
      if (output.memories.length > expected.maxMemoryCount) {
        score -= 0.2
        issues.push(`Too many memories: ${output.memories.length} > ${expected.maxMemoryCount}`)
      } else {
        successes.push(`Within maximum memory count: ${output.memories.length} <= ${expected.maxMemoryCount}`)
      }
    }

    // 检查必需的 key
    if (expected.requiredKeys && expected.requiredKeys.length > 0) {
      const outputKeys = output.memories.map(m => m.key.toLowerCase())
      const missingKeys: string[] = []

      for (const requiredKey of expected.requiredKeys) {
        const found = outputKeys.some(key => key.includes(requiredKey.toLowerCase()))
        if (!found) {
          missingKeys.push(requiredKey)
        }
      }

      if (missingKeys.length > 0) {
        score -= 0.4
        issues.push(`Missing required keys: ${missingKeys.join(', ')}`)
      } else {
        successes.push(`Contains all required keys: ${expected.requiredKeys.join(', ')}`)
      }
    }

    // 检查最小重要性
    if (expected.minImportance !== undefined && output.memories.length > 0) {
      const lowImportanceMemories = output.memories.filter(
        m => (m.importance ?? 0) < expected.minImportance!
      )

      if (lowImportanceMemories.length > 0) {
        score -= 0.2
        issues.push(`${lowImportanceMemories.length} memories below minimum importance ${expected.minImportance}`)
      } else {
        successes.push(`All memories meet minimum importance threshold`)
      }
    }

    // 确保分数在 0-1 之间
    score = Math.max(0, Math.min(1, score))

    const explanation = issues.length > 0
      ? `Accuracy score: ${score.toFixed(2)}. Issues: ${issues.join('; ')}`
      : `Accuracy score: ${score.toFixed(2)}. ${successes.join('; ')}`

    return {
      score,
      explanation,
      snippets: issues.length > 0 ? issues : successes
    }
  }

  /**
   * 验证输出
   */
  private validateOutput(output: unknown): MemoryOutput {
    if (!output || typeof output !== 'object') {
      throw new Error('Output must be an object')
    }

    const out = output as Record<string, unknown>

    if (out.operation !== 'extract' && out.operation !== 'retrieve') {
      throw new Error('Output operation must be "extract" or "retrieve"')
    }

    if (!Array.isArray(out.memories)) {
      throw new Error('Output must include memories array')
    }

    return {
      operation: out.operation as 'extract' | 'retrieve',
      memories: out.memories as any[]
    }
  }

  /**
   * 验证期望输出
   */
  private validateExpected(expected: unknown): MemoryExpected {
    if (!expected || typeof expected !== 'object') {
      throw new Error('Expected must be an object')
    }

    const exp = expected as Record<string, unknown>

    if (exp.operation !== 'extract' && exp.operation !== 'retrieve') {
      throw new Error('Expected operation must be "extract" or "retrieve"')
    }

    return {
      operation: exp.operation as 'extract' | 'retrieve',
      minMemoryCount: typeof exp.minMemoryCount === 'number' ? exp.minMemoryCount : undefined,
      maxMemoryCount: typeof exp.maxMemoryCount === 'number' ? exp.maxMemoryCount : undefined,
      requiredKeys: Array.isArray(exp.requiredKeys) ? exp.requiredKeys as string[] : undefined,
      minImportance: typeof exp.minImportance === 'number' ? exp.minImportance : undefined
    }
  }
}
