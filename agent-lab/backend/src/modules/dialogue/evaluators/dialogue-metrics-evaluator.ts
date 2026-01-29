/**
 * DialogueMetricsEvaluator - 对话指标评估器
 */

import type { Evaluator } from '../../../core/contracts/evaluator.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { ScoreRecord } from '../../../core/contracts/score-record.js'
import { randomUUID } from 'crypto'
import type { DialogueOutput } from '../runners/dialogue-llm-runner.js'

/**
 * Dialogue 期望输出
 */
export interface DialogueExpected {
  responseContains?: string[]            // 响应应包含的关键词
  responseNotContains?: string[]         // 响应不应包含的关键词
  minResponseLength?: number             // 最小响应长度
  maxResponseLength?: number             // 最大响应长度
}

/**
 * DialogueMetricsEvaluator - 对话指标评估器
 */
export class DialogueMetricsEvaluator implements Evaluator {
  readonly id = 'dialogue.metrics'
  readonly metrics = ['relevance', 'length', 'latency']

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
          metric: 'relevance',
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

    // 1. Relevance - 响应相关性
    if (task.expected) {
      const expected = this.validateExpected(task.expected)
      const relevanceScore = this.calculateRelevance(output, expected)

      scores.push({
        id: randomUUID(),
        runId: run.id,
        metric: 'relevance',
        value: relevanceScore.score,
        target: 'final',
        evidence: {
          explanation: relevanceScore.explanation,
          snippets: relevanceScore.snippets
        },
        evaluatorId: this.id,
        createdAt
      })
    }

    // 2. Length - 响应长度
    const responseLength = output.response.length
    scores.push({
      id: randomUUID(),
      runId: run.id,
      metric: 'response_length',
      value: responseLength,
      target: 'final',
      evidence: {
        explanation: `Response length: ${responseLength} characters`
      },
      evaluatorId: this.id,
      createdAt
    })

    // 3. History Length - 对话历史长度
    scores.push({
      id: randomUUID(),
      runId: run.id,
      metric: 'history_length',
      value: output.history.length,
      target: 'global',
      evidence: {
        explanation: `Dialogue history contains ${output.history.length} messages`
      },
      evaluatorId: this.id,
      createdAt
    })

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
   * 计算相关性
   */
  private calculateRelevance(
    output: DialogueOutput,
    expected: DialogueExpected
  ): { score: number; explanation: string; snippets?: string[] } {
    const response = output.response.toLowerCase()
    const issues: string[] = []
    const successes: string[] = []
    let score = 1.0

    // 检查必须包含的关键词
    if (expected.responseContains && expected.responseContains.length > 0) {
      const missingKeywords: string[] = []
      for (const keyword of expected.responseContains) {
        if (!response.includes(keyword.toLowerCase())) {
          missingKeywords.push(keyword)
        }
      }

      if (missingKeywords.length > 0) {
        score -= 0.5
        issues.push(`Missing keywords: ${missingKeywords.join(', ')}`)
      } else {
        successes.push(`Contains all required keywords: ${expected.responseContains.join(', ')}`)
      }
    }

    // 检查不应包含的关键词
    if (expected.responseNotContains && expected.responseNotContains.length > 0) {
      const foundKeywords: string[] = []
      for (const keyword of expected.responseNotContains) {
        if (response.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword)
        }
      }

      if (foundKeywords.length > 0) {
        score -= 0.3
        issues.push(`Contains forbidden keywords: ${foundKeywords.join(', ')}`)
      } else {
        successes.push('Does not contain forbidden keywords')
      }
    }

    // 检查长度限制
    if (expected.minResponseLength !== undefined) {
      if (output.response.length < expected.minResponseLength) {
        score -= 0.2
        issues.push(`Response too short: ${output.response.length} < ${expected.minResponseLength}`)
      } else {
        successes.push(`Response meets minimum length: ${output.response.length} >= ${expected.minResponseLength}`)
      }
    }

    if (expected.maxResponseLength !== undefined) {
      if (output.response.length > expected.maxResponseLength) {
        score -= 0.2
        issues.push(`Response too long: ${output.response.length} > ${expected.maxResponseLength}`)
      } else {
        successes.push(`Response within maximum length: ${output.response.length} <= ${expected.maxResponseLength}`)
      }
    }

    // 确保分数在 0-1 之间
    score = Math.max(0, Math.min(1, score))

    const explanation = issues.length > 0
      ? `Relevance score: ${score.toFixed(2)}. Issues: ${issues.join('; ')}`
      : `Relevance score: ${score.toFixed(2)}. ${successes.join('; ')}`

    return {
      score,
      explanation,
      snippets: issues.length > 0 ? issues : successes
    }
  }

  /**
   * 验证输出
   */
  private validateOutput(output: unknown): DialogueOutput {
    if (!output || typeof output !== 'object') {
      throw new Error('Output must be an object')
    }

    const out = output as Record<string, unknown>

    if (typeof out.response !== 'string') {
      throw new Error('Output must include response field')
    }

    if (!Array.isArray(out.history)) {
      throw new Error('Output must include history array')
    }

    return {
      response: out.response,
      history: out.history as any[]
    }
  }

  /**
   * 验证期望输出
   */
  private validateExpected(expected: unknown): DialogueExpected {
    if (!expected || typeof expected !== 'object') {
      return {}
    }

    const exp = expected as Record<string, unknown>

    return {
      responseContains: Array.isArray(exp.responseContains) ? exp.responseContains as string[] : undefined,
      responseNotContains: Array.isArray(exp.responseNotContains) ? exp.responseNotContains as string[] : undefined,
      minResponseLength: typeof exp.minResponseLength === 'number' ? exp.minResponseLength : undefined,
      maxResponseLength: typeof exp.maxResponseLength === 'number' ? exp.maxResponseLength : undefined
    }
  }
}
