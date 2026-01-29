/**
 * IntentLLMRunner - Intent 识别 Runner 实现
 *
 * 将现有的 IntentRecognizer 逻辑适配为符合 Runner 接口的实现
 */

import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { LLMRequest } from '../../../types/llm.js'
import { randomUUID } from 'crypto'

/**
 * Intent 模块的配置
 */
export interface IntentRunnerConfig {
  intents: string[]                      // 支持的意图列表
  examples?: Record<string, string[]>    // 每个意图的示例
  temperature?: number                   // LLM 温度
  maxTokens?: number                     // 最大 token 数
}

/**
 * Intent 识别的输入
 */
export interface IntentInput {
  text: string                           // 用户输入文本
}

/**
 * Intent 识别的输出
 */
export interface IntentOutput {
  intent: string                         // 识别的意图
  confidence: number                     // 置信度 (0-1)
  reasoning?: string                     // 推理过程
}

/**
 * IntentLLMRunner - 基于 LLM 的意图识别 Runner
 */
export class IntentLLMRunner implements Runner {
  readonly id = 'intent.llm'
  readonly type = 'intent'
  readonly version = '1.0.0'

  constructor(private readonly llmClient: LLMClient) {}

  async execute(
    task: AtomicTask,
    config: unknown
  ): Promise<RunRecord> {
    const runId = randomUUID()
    const startedAt = new Date()
    const trace: TraceEvent[] = []

    try {
      // 验证配置
      const runnerConfig = this.validateConfig(config)
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'config_validated',
        data: { intents: runnerConfig.intents }
      })

      // 验证输入
      const input = this.validateInput(task.input)
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'input_validated',
        data: { textLength: input.text.length }
      })

      // 构建 system prompt
      const systemPrompt = this.buildSystemPrompt(runnerConfig)
      trace.push({
        timestamp: new Date(),
        level: 'debug',
        event: 'prompt_built',
        data: { promptLength: systemPrompt.length }
      })

      // 调用 LLM
      const llmRequest: LLMRequest = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input.text }
        ],
        temperature: runnerConfig.temperature ?? 0.3,
        maxTokens: runnerConfig.maxTokens ?? 100
      }

      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'llm_request_start',
        data: {
          temperature: llmRequest.temperature,
          maxTokens: llmRequest.maxTokens
        }
      })

      const llmStartTime = Date.now()
      const response = await this.llmClient.chat(llmRequest)
      const llmLatency = Date.now() - llmStartTime

      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'llm_response_received',
        data: {
          latency: llmLatency,
          contentLength: response.content.length
        }
      })

      // 解析 LLM 响应
      const output = this.parseResponse(response.content, runnerConfig.intents)
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'response_parsed',
        data: {
          intent: output.intent,
          confidence: output.confidence
        }
      })

      // 计算总耗时
      const completedAt = new Date()
      const latency = completedAt.getTime() - startedAt.getTime()

      // 返回成功的 RunRecord
      return {
        id: runId,
        taskId: task.id,
        taskType: 'atomic',
        status: 'completed',
        output,
        metrics: {
          latency,
          tokens: response.usage?.totalTokens,
          cost: this.calculateCost(response.usage?.totalTokens)
        },
        trace,
        startedAt,
        completedAt,
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config: runnerConfig
        }
      }
    } catch (error) {
      // 记录错误
      trace.push({
        timestamp: new Date(),
        level: 'error',
        event: 'execution_failed',
        data: {
          error: error instanceof Error ? error.message : String(error)
        }
      })

      // 返回失败的 RunRecord
      return {
        id: runId,
        taskId: task.id,
        taskType: 'atomic',
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        metrics: {
          latency: Date.now() - startedAt.getTime()
        },
        trace,
        startedAt,
        provenance: {
          runnerId: this.id,
          runnerVersion: this.version,
          config: config as Record<string, unknown> ?? {}
        }
      }
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: unknown): IntentRunnerConfig {
    if (!config || typeof config !== 'object') {
      throw new Error('Config must be an object')
    }

    const cfg = config as Record<string, unknown>

    if (!Array.isArray(cfg.intents) || cfg.intents.length === 0) {
      throw new Error('Config must include non-empty intents array')
    }

    return {
      intents: cfg.intents as string[],
      examples: cfg.examples as Record<string, string[]> | undefined,
      temperature: typeof cfg.temperature === 'number' ? cfg.temperature : undefined,
      maxTokens: typeof cfg.maxTokens === 'number' ? cfg.maxTokens : undefined
    }
  }

  /**
   * 验证输入
   */
  private validateInput(input: unknown): IntentInput {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object')
    }

    const inp = input as Record<string, unknown>

    if (typeof inp.text !== 'string' || inp.text.trim().length === 0) {
      throw new Error('Input must include non-empty text field')
    }

    return {
      text: inp.text
    }
  }

  /**
   * 构建 system prompt
   */
  private buildSystemPrompt(config: IntentRunnerConfig): string {
    let prompt = `You are an intent recognition system. Your task is to identify the user's intent from their input.

Available intents:
${config.intents.map(intent => `- ${intent}`).join('\n')}
`

    if (config.examples && Object.keys(config.examples).length > 0) {
      prompt += '\nExamples for each intent:\n'
      for (const [intent, examples] of Object.entries(config.examples)) {
        prompt += `- ${intent}: ${examples.join(', ')}\n`
      }
    }

    prompt += `
You must respond with a JSON object in the following format:
{
  "intent": "one of the available intents",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of why you chose this intent"
}

IMPORTANT: Your response must be ONLY the JSON object, no additional text.`

    return prompt
  }

  /**
   * 解析 LLM 响应
   */
  private parseResponse(content: string, allowedIntents: string[]): IntentOutput {
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>

      if (typeof parsed.intent !== 'string') {
        throw new Error('Response must include intent field')
      }

      if (typeof parsed.confidence !== 'number') {
        throw new Error('Response must include confidence field')
      }

      // 验证 intent 是否在允许列表中
      if (!allowedIntents.includes(parsed.intent)) {
        throw new Error(
          `Intent "${parsed.intent}" not in allowed list: ${allowedIntents.join(', ')}`
        )
      }

      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse LLM response as JSON: ${content}`)
      }
      throw error
    }
  }

  /**
   * 计算成本（简化版本，实际应根据模型定价）
   */
  private calculateCost(tokens?: number): number | undefined {
    if (!tokens) return undefined
    // 假设每 1000 tokens 成本 $0.002
    return (tokens / 1000) * 0.002
  }
}
