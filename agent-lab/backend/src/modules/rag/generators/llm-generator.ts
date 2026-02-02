import type { LLMClient } from '../../../lib/llm/client.js'
import type { LLMRequest, LLMMessage } from '../../../types/llm.js'
import type { RagGeneratedOutput, RagSentence } from '../schemas.js'

type RetrievedChunk = { chunkId: string; text: string }

type LLMGeneratorConfig = {
  temperature?: number
  maxTokens?: number
  modelName?: string
}

export class RagLLMGenerator {
  constructor(
    private readonly llmClient: LLMClient,
    private readonly config: LLMGeneratorConfig = {}
  ) {}

  async generate(input: {
    query: string
    retrievedChunks: RetrievedChunk[]
  }): Promise<RagGeneratedOutput> {
    const allowedChunkIds = input.retrievedChunks.map(chunk => chunk.chunkId)

    const prompt = this.buildSystemPrompt(input.query, input.retrievedChunks)
    const response = await this.requestLLM([
      { role: 'system', content: prompt },
      { role: 'user', content: input.query }
    ])

    try {
      return this.parseResponse(response, allowedChunkIds)
    } catch (error) {
      const repairPrompt = this.buildRepairPrompt(response, error, allowedChunkIds)
      const repaired = await this.requestLLM([{ role: 'system', content: repairPrompt }])
      return this.parseResponse(repaired, allowedChunkIds)
    }
  }

  private async requestLLM(messages: LLMMessage[]): Promise<string> {
    const request: LLMRequest = {
      messages,
      temperature: this.config.temperature ?? 0,
      maxTokens: this.config.maxTokens ?? 512
    }
    const response = await this.llmClient.chat(request)
    return response.content
  }

  private buildSystemPrompt(query: string, chunks: RetrievedChunk[]): string {
    const chunkLines = chunks
      .map(chunk => `- ${chunk.chunkId}: ${chunk.text}`)
      .join('\n')

    return `You are a RAG answer generator.
You must answer the user query using ONLY the provided chunks and cite them.
Return ONLY a JSON object in this exact schema:
{
  "answer": "string",
  "sentences": [
    {
      "sentenceId": "s1",
      "text": "string",
      "citations": [{ "chunkId": "chunk-id" }]
    }
  ]
}

Rules:
- sentenceId must be sequential: s1..sN
- citations may be empty but must be an array
- cite ONLY chunkId values from the allowed list
- output must be valid JSON and nothing else

Allowed chunkIds: ${chunks.map(c => c.chunkId).join(', ')}

Chunks:
${chunkLines}

User query: ${query}`
  }

  private buildRepairPrompt(
    previousContent: string,
    error: unknown,
    allowedChunkIds: string[]
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `Your previous response was invalid JSON or did not match the required schema.
Fix it and output ONLY valid JSON with the required schema:
{
  "answer": "string",
  "sentences": [
    {
      "sentenceId": "s1",
      "text": "string",
      "citations": [{ "chunkId": "chunk-id" }]
    }
  ]
}

Rules:
- sentenceId must be sequential: s1..sN
- citations must be an array (can be empty)
- cite ONLY chunkId values from: ${allowedChunkIds.join(', ')}
- output ONLY JSON

Reason: ${errorMessage}

Previous response:
${previousContent}`
  }

  private parseResponse(content: string, allowedChunkIds: string[]): RagGeneratedOutput {
    let parsed: Record<string, unknown>

    try {
      parsed = JSON.parse(content) as Record<string, unknown>
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${content}`)
    }

    if (typeof parsed.answer !== 'string') {
      throw new Error('Response must include answer field')
    }

    if (!Array.isArray(parsed.sentences)) {
      throw new Error('Response must include sentences array')
    }

    const sentences = parsed.sentences.map((sentence, index) =>
      this.parseSentence(sentence, index, allowedChunkIds)
    )

    const sourcesUsed = Array.from(
      new Set(sentences.flatMap(s => s.citations?.map(c => c.chunkId) ?? []))
    )

    return {
      answer: parsed.answer,
      sentences,
      generatorType: 'llm',
      sourcesUsed
    }
  }

  private parseSentence(
    sentence: unknown,
    index: number,
    allowedChunkIds: string[]
  ): RagSentence {
    if (typeof sentence !== 'object' || sentence === null) {
      throw new Error('Sentence must be an object')
    }

    const record = sentence as Record<string, unknown>
    const sentenceId = record.sentenceId
    const text = record.text

    if (typeof sentenceId !== 'string') {
      throw new Error('Sentence must include sentenceId')
    }

    const expectedId = `s${index + 1}`
    if (sentenceId !== expectedId) {
      throw new Error(`SentenceId must be sequential, expected ${expectedId}`)
    }

    if (typeof text !== 'string') {
      throw new Error('Sentence must include text')
    }

    const citationsRaw = Array.isArray(record.citations) ? record.citations : []
    const citations = citationsRaw.map(citation => {
      if (typeof citation !== 'object' || citation === null) {
        throw new Error('Citation must be an object')
      }
      const chunkId = (citation as Record<string, unknown>).chunkId
      if (typeof chunkId !== 'string') {
        throw new Error('Citation must include chunkId')
      }
      if (!allowedChunkIds.includes(chunkId)) {
        throw new Error(`Citation chunkId "${chunkId}" not in retrieved chunks`)
      }
      return { chunkId }
    })

    return {
      sentenceId,
      text,
      citations
    }
  }
}
