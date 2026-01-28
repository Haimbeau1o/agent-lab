import type { LLMClient } from '../llm/client.js'
import type { IntentConfig, IntentResult } from '../../types/agent.js'
import type { LLMRequest } from '../../types/llm.js'

export class IntentRecognizer {
  private readonly llmClient: LLMClient
  private readonly config: IntentConfig

  constructor(llmClient: LLMClient, config: IntentConfig) {
    this.llmClient = llmClient
    this.config = config
  }

  async recognize(input: string): Promise<IntentResult> {
    const systemPrompt = this.buildSystemPrompt()

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: this.config.temperature || 0.3,
      maxTokens: this.config.maxTokens || 100
    }

    const response = await this.llmClient.chat(request)

    try {
      const result = JSON.parse(response.content) as IntentResult

      // 验证 intent 是否在允许列表中
      if (!this.config.intents.includes(result.intent)) {
        throw new Error(`Intent "${result.intent}" not in allowed list: ${this.config.intents.join(', ')}`)
      }

      return result
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse LLM response as JSON: ${response.content}`)
      }
      throw error
    }
  }

  private buildSystemPrompt(): string {
    let prompt = `You are an intent recognition system. Your task is to identify the user's intent from their input.

Available intents:
${this.config.intents.map(intent => `- ${intent}`).join('\n')}
`

    if (this.config.examples && Object.keys(this.config.examples).length > 0) {
      prompt += '\nExamples for each intent:\n'
      for (const [intent, examples] of Object.entries(this.config.examples)) {
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
}
