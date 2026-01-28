import type { LLMClient } from '../llm/client.js'
import type { MemoryConfig, MemoryItem } from '../../types/agent.js'
import type { LLMRequest } from '../../types/llm.js'

export class MemoryManager {
  private readonly llmClient: LLMClient
  private readonly config: MemoryConfig
  private memories: Map<string, MemoryItem> = new Map()

  constructor(llmClient: LLMClient, config: MemoryConfig) {
    this.llmClient = llmClient
    this.config = config
  }

  async extractAndStore(message: string): Promise<void> {
    const systemPrompt = this.buildExtractionPrompt()

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: this.config.temperature || 0.5,
      maxTokens: this.config.maxTokens || 200
    }

    const response = await this.llmClient.chat(request)

    try {
      const result = JSON.parse(response.content) as { memories: Array<Omit<MemoryItem, 'timestamp'>> }

      for (const memory of result.memories) {
        const memoryItem: MemoryItem = {
          ...memory,
          timestamp: new Date()
        }

        this.memories.set(memory.key, memoryItem)
      }

      // 管理记忆大小
      this.pruneMemories()
    } catch (error) {
      throw new Error(`Failed to parse memory extraction response: ${response.content}`)
    }
  }

  async retrieve(query: string): Promise<MemoryItem[]> {
    const allMemories = this.getAllMemories()

    if (allMemories.length === 0) {
      return []
    }

    // 简单的关键词匹配检索
    const relevantMemories = allMemories.filter(memory => {
      const queryLower = query.toLowerCase()
      const keyLower = memory.key.toLowerCase()
      const valueLower = String(memory.value).toLowerCase()

      return keyLower.includes(queryLower) ||
             valueLower.includes(queryLower) ||
             query.includes(keyLower) ||
             query.includes(valueLower)
    })

    // 按重要性排序
    return relevantMemories.sort((a, b) => (b.importance || 0) - (a.importance || 0))
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values())
  }

  clearMemories(): void {
    this.memories.clear()
  }

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

  private pruneMemories(): void {
    const maxSize = this.config.maxMemorySize || 100

    if (this.memories.size > maxSize) {
      // 按重要性排序，保留最重要的记忆
      const sortedMemories = Array.from(this.memories.entries())
        .sort(([, a], [, b]) => (b.importance || 0) - (a.importance || 0))

      this.memories.clear()

      for (let i = 0; i < maxSize; i++) {
        const [key, memory] = sortedMemories[i]
        this.memories.set(key, memory)
      }
    }
  }
}
