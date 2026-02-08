/**
 * MemoryLLMRunner - 记忆管理 Runner 实现
 *
 * 将现有的 MemoryManager 逻辑适配为符合 Runner 接口的实现
 */

import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record.js'
import type { LLMClient } from '../../../lib/llm/client.js'
import type { LLMRequest } from '../../../types/llm.js'
import { randomUUID } from 'crypto'

/**
 * Memory 模块的配置
 */
export interface MemoryRunnerConfig {
  storageType?: 'json' | 'vector'        // 存储类型
  maxMemorySize?: number                 // 最大记忆条数
  temperature?: number                   // LLM 温度
  maxTokens?: number                     // 最大 token 数
}

/**
 * 记忆项
 */
export interface MemoryItem {
  key: string
  value: unknown
  importance?: number                    // 重要性权重 (0-1)
  timestamp?: Date
}

/**
 * Memory 输入
 */
export interface MemoryInput {
  operation: 'extract' | 'retrieve'      // 操作类型
  message: string                        // 消息内容
  existingMemories?: MemoryItem[]        // 现有记忆（用于检索）
}

/**
 * Memory 输出
 */
export interface MemoryOutput {
  operation: 'extract' | 'retrieve'
  memories: MemoryItem[]                 // 提取的记忆或检索到的记忆
}

/**
 * MemoryLLMRunner - 基于 LLM 的记忆管理 Runner
 */
export class MemoryLLMRunner implements Runner {
  readonly id = 'memory.llm'
  readonly type = 'memory'
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
        data: { maxMemorySize: runnerConfig.maxMemorySize }
      })

      // 验证输入
      const input = this.validateInput(task.input)
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'input_validated',
        data: {
          operation: input.operation,
          messageLength: input.message.length
        }
      })

      // 根据操作类型执行
      let output: MemoryOutput
      if (input.operation === 'extract') {
        output = await this.executeExtract(input, runnerConfig, trace)
      } else {
        output = await this.executeRetrieve(input, runnerConfig, trace)
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
          tokens: undefined, // 会在 executeExtract/executeRetrieve 中更新
          cost: undefined
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
   * 执行记忆提取
   */
  private async executeExtract(
    input: MemoryInput,
    config: MemoryRunnerConfig,
    trace: TraceEvent[]
  ): Promise<MemoryOutput> {
    const systemPrompt = this.buildExtractionPrompt()

    trace.push({
      timestamp: new Date(),
      level: 'debug',
      event: 'extraction_prompt_built',
      data: { promptLength: systemPrompt.length }
    })

    const llmRequest: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.message }
      ],
      temperature: config.temperature ?? 0.5,
      maxTokens: config.maxTokens ?? 200
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

    // 解析响应
    const memories = this.parseExtractionResponse(response.content)

    trace.push({
      timestamp: new Date(),
      level: 'info',
      event: 'memories_extracted',
      data: {
        memoryCount: memories.length
      }
    })

    return {
      operation: 'extract',
      memories
    }
  }

  /**
   * 执行记忆检索
   */
  private async executeRetrieve(
    input: MemoryInput,
    _config: MemoryRunnerConfig,
    trace: TraceEvent[]
  ): Promise<MemoryOutput> {
    const existingMemories = input.existingMemories ?? []

    trace.push({
      timestamp: new Date(),
      level: 'info',
      event: 'retrieval_start',
      data: {
        totalMemories: existingMemories.length,
        query: input.message
      }
    })

    if (existingMemories.length === 0) {
      trace.push({
        timestamp: new Date(),
        level: 'info',
        event: 'retrieval_complete',
        data: { retrievedCount: 0 }
      })

      return {
        operation: 'retrieve',
        memories: []
      }
    }

    // 简单的关键词匹配检索
    const queryLower = input.message.toLowerCase()
    const relevantMemories = existingMemories.filter(memory => {
      const keyLower = memory.key.toLowerCase()
      const valueLower = String(memory.value).toLowerCase()

      return keyLower.includes(queryLower) ||
             valueLower.includes(queryLower) ||
             queryLower.includes(keyLower) ||
             queryLower.includes(valueLower)
    })

    // 按重要性排序
    const sortedMemories = relevantMemories.sort(
      (a, b) => (b.importance ?? 0) - (a.importance ?? 0)
    )

    trace.push({
      timestamp: new Date(),
      level: 'info',
      event: 'retrieval_complete',
      data: {
        retrievedCount: sortedMemories.length
      }
    })

    return {
      operation: 'retrieve',
      memories: sortedMemories
    }
  }

  /**
   * 构建提取 prompt
   */
  private buildExtractionPrompt(): string {
    return `You are a memory extraction system. Your task is to identify and extract important, factual information from user messages that should be remembered for future reference.

Extract information such as:
- Personal details (name, age, occupation, etc.)
- Preferences and interests
- Important facts or data
- Relationships and connections

Ignore:
- Temporary states (current mood, weather)
- Casual conversation filler
- Questions without answers

Respond with a JSON object in the following format:
{
  "memories": [
    {
      "key": "descriptive_key_name",
      "value": "the actual value or information",
      "importance": 0.0 to 1.0 (how important this information is)
    }
  ]
}

If no important information is found, return {"memories": []}.

IMPORTANT: Your response must be ONLY the JSON object, no additional text.`
  }

  /**
   * 解析提取响应
   */
  private parseExtractionResponse(content: string): MemoryItem[] {
    try {
      const parsed = JSON.parse(content) as { memories: Array<Omit<MemoryItem, 'timestamp'>> }

      if (!Array.isArray(parsed.memories)) {
        throw new Error('Response must include memories array')
      }

      return parsed.memories.map(memory => ({
        ...memory,
        timestamp: new Date()
      }))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse LLM response as JSON: ${content}`)
      }
      throw error
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: unknown): MemoryRunnerConfig {
    if (!config || typeof config !== 'object') {
      return {} // 使用默认配置
    }

    const cfg = config as Record<string, unknown>

    return {
      storageType: cfg.storageType === 'json' || cfg.storageType === 'vector' ? cfg.storageType : undefined,
      maxMemorySize: typeof cfg.maxMemorySize === 'number' ? cfg.maxMemorySize : undefined,
      temperature: typeof cfg.temperature === 'number' ? cfg.temperature : undefined,
      maxTokens: typeof cfg.maxTokens === 'number' ? cfg.maxTokens : undefined
    }
  }

  /**
   * 验证输入
   */
  private validateInput(input: unknown): MemoryInput {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object')
    }

    const inp = input as Record<string, unknown>

    if (inp.operation !== 'extract' && inp.operation !== 'retrieve') {
      throw new Error('Input operation must be "extract" or "retrieve"')
    }

    if (typeof inp.message !== 'string' || inp.message.trim().length === 0) {
      throw new Error('Input must include non-empty message field')
    }

    // 验证现有记忆（如果提供）
    let existingMemories: MemoryItem[] | undefined
    if (inp.existingMemories !== undefined) {
      if (!Array.isArray(inp.existingMemories)) {
        throw new Error('existingMemories must be an array')
      }
      existingMemories = inp.existingMemories as MemoryItem[]
    }

    return {
      operation: inp.operation as 'extract' | 'retrieve',
      message: inp.message,
      existingMemories
    }
  }
}
