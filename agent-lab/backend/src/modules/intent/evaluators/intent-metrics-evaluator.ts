/**
 * IntentMetricsEvaluator - Intent 指标评估器
 *
 * 将现有的 calculateIntentMetrics 逻辑适配为符合 Evaluator 接口的实现
 */

import type { Evaluator } from '../../../core/contracts/evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { ScoreRecord } from '../../../core/contracts/score-record.js'
import { randomUUID } from 'crypto'
import type { IntentOutput } from '../runners/intent-llm-runner.js'

/**
 * Intent 期望输出
 */
export interface IntentExpected {
  intent: string                         // 期望的意图
  confidence?: number                    // 期望的最小置信度
}

/**
 * IntentMetricsEvaluator - Intent 指标评估器
 */
export class IntentMetricsEvaluator implements Evaluator {
  readonly id = 'intent.metrics'
  readonly metrics = ['accuracy', 'confidence', 'latency']

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

    // 1. Accuracy - 意图是否正确
    if (task.expected) {
      const expected = this.validateExpected(task.expected)
      const isCorrect = output.intent === expected.intent

      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'accuracy',
        value: isCorrect ? 1 : 0,
        target: 'final',
        evidence: {
          explanation: isCorrect
            ? `Intent correctly identified as "${output.intent}"`
            : `Expected "${expected.intent}" but got "${output.intent}"`,
          alignment: {
            expected: expected.intent,
            actual: output.intent
          }
        },
        evaluatorId: this.id,
        createdAt
      })

      // 如果期望有最小置信度要求，检查置信度
      if (expected.confidence !== undefined) {
        const meetsConfidence = output.confidence >= expected.confidence

        scores.push({
          id: randomUUID(),
          runId: run.id,
          metric: 'confidence_threshold',
          value: meetsConfidence,
          target: 'final',
          evidence: {
            explanation: meetsConfidence
              ? `Confidence ${output.confidence.toFixed(2)} meets threshold ${expected.confidence}`
              : `Confidence ${output.confidence.toFixed(2)} below threshold ${expected.confidence}`,
            alignment: {
              threshold: expected.confidence,
              actual: output.confidence
            }
          },
          evaluatorId: this.id,
          createdAt
        })
      }
    }

    // 2. Confidence - 置信度分数
    scores.push({
      id: randomUUID(),
      runId: run.id,
      metric: 'confidence',
      value: output.confidence,
      target: 'final',
      evidence: {
        explanation: `Model confidence: ${output.confidence.toFixed(2)}`,
        snippets: output.reasoning ? [output.reasoning] : undefined
      },
      evaluatorId: this.id,
      createdAt
    })

    // 3. Latency - 执行耗时
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

    // 4. Token Usage - Token 消耗（如果有）
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

    // 5. Cost - 成本（如果有）
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
   * 验证输出
   */
  private validateOutput(output: unknown): IntentOutput {
    if (!output || typeof output !== 'object') {
      throw new Error('Output must be an object')
    }

    const out = output as Record<string, unknown>

    if (typeof out.intent !== 'string') {
      throw new Error('Output must include intent field')
    }

    if (typeof out.confidence !== 'number') {
      throw new Error('Output must include confidence field')
    }

    return {
      intent: out.intent,
      confidence: out.confidence,
      reasoning: typeof out.reasoning === 'string' ? out.reasoning : undefined
    }
  }

  /**
   * 验证期望输出
   */
  private validateExpected(expected: unknown): IntentExpected {
    if (!expected || typeof expected !== 'object') {
      throw new Error('Expected must be an object')
    }

    const exp = expected as Record<string, unknown>

    if (typeof exp.intent !== 'string') {
      throw new Error('Expected must include intent field')
    }

    return {
      intent: exp.intent,
      confidence: typeof exp.confidence === 'number' ? exp.confidence : undefined
    }
  }
}
