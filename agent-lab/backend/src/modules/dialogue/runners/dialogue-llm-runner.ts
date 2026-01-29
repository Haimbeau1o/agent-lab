/**
 * DialogueLLMRunner - 对话管理 Runner 实现
 *
 * 将现有的 DialogueManager 逻辑适配为符合 Runner 接口的实现
 */

import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { LLMRequest, LLMMessage } from '../../../types/llm.js'
import { randomUUID } from 'crypto'

/**
 * Dialogue 模块的配置
 */
export interface DialogueRunnerConfig {
  maxHistoryLength?: number              // 最大历史记录长度
  contextWindowSize?: number             // 上下文窗口大小
  temperature?: number                   // LLM 温度
  maxTokens?: number                     // 最大 token 数
}

/**
 * 对话消息
 */
export interface DialogueMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

/**
 * Dialogue 输入
 */
export interface DialogueInput {
  message: string                        // 用户消息
  history?: DialogueMessage[]            // 对话历史
}

/**
 * Dialogue 输出
 */
export interface DialogueOutput {
  response: string                       // 助手响应
  history: DialogueMessage[]             // 更新后的对话历史
}

/**
 * DialogueLLMRunner - 基于 LLM 的对话管理 Runner
 */
export class DialogueLLMRunner implements Runner {
  readonly id = 'dialogue.llm'
  readonly type = 'dialogue'
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
        data: { maxHistoryLength: runnerConfig.maxHistoryLength }
      })

      // 验证输入
      const input = this.validateInput(task.input)
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'input_validated',
        data: {
          messageLength: input.message.length,
          historyLength: input.history?.length ?? 0
        }
      })

      // 构建对话历史
      const history = input.history ?? []
      const userMessage: DialogueMessage = {
        role: 'user',
        content: input.message,
        timestamp: new Date()
      }
      const updatedHistory = [...history, userMessage]

      // 截断历史
      const truncatedHistory = this.truncateHistory(
        updatedHistory,
        runnerConfig.maxHistoryLength ?? 10
      )
      trace.push({
        timestamp: new Date(),
        level: 'debug',
        event: 'history_truncated',
        data: {
          originalLength: updatedHistory.length,
          truncatedLength: truncatedHistory.length
        }
      })

      // 构建 LLM 请求
      const messages: LLMMessage[] = truncatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const llmRequest: LLMRequest = {
        messages,
        temperature: runnerConfig.temperature ?? 0.7,
        maxTokens: runnerConfig.maxTokens ?? 150
      }

      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'llm_request_start',
        data: {
          messageCount: messages.length,
          temperature: llmRequest.temperature,
          maxTokens: llmRequest.maxTokens
        }
      })

      // 调用 LLM
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

      // 添加助手响应到历史
      const assistantMessage: DialogueMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      }
      const finalHistory = [...truncatedHistory, assistantMessage]

      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'response_generated',
        data: {
          responseLength: response.content.length,
          finalHistoryLength: finalHistory.length
        }
      })

      // 构建输出
      const output: DialogueOutput = {
        response: response.content,
        history: finalHistory
      }

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
          config: config as Record<string, unknown> ?? {}
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
  private validateConfig(config: unknown): DialogueRunnerConfig {
    if (!config || typeof config !== 'object') {
      return {} // 使用默认配置
    }

    const cfg = config as Record<string, unknown>

    return {
      maxHistoryLength: typeof cfg.maxHistoryLength === 'number' ? cfg.maxHistoryLength : undefined,
      contextWindowSize: typeof cfg.contextWindowSize === 'number' ? cfg.contextWindowSize : undefined,
      temperature: typeof cfg.temperature === 'number' ? cfg.temperature : undefined,
      maxTokens: typeof cfg.maxTokens === 'number' ? cfg.maxTokens : undefined
    }
  }

  /**
   * 验证输入
   */
  private validateInput(input: unknown): DialogueInput {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object')
    }

    const inp = input as Record<string, unknown>

    if (typeof inp.message !== 'string' || inp.message.trim().length === 0) {
      throw new Error('Input must include non-empty message field')
    }

    // 验证历史记录（如果提供）
    let history: DialogueMessage[] | undefined
    if (inp.history !== undefined) {
      if (!Array.isArray(inp.history)) {
        throw new Error('History must be an array')
      }
      history = inp.history as DialogueMessage[]
    }

    return {
      message: inp.message,
      history
    }
  }

  /**
   * 截断历史记录
   */
  private truncateHistory(
    history: DialogueMessage[],
    maxLength: number
  ): DialogueMessage[] {
    if (history.length <= maxLength) {
      return history
    }

    // 保留最近的 maxLength 条消息
    return history.slice(-maxLength)
  }

  /**
   * 计算成本（简化版本）
   */
  private calculateCost(tokens?: number): number | undefined {
    if (!tokens) return undefined
    // 假设每 1000 tokens 成本 $0.002
    return (tokens / 1000) * 0.002
  }
}
