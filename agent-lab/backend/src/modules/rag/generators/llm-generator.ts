export class LlmGenerator {
  constructor(private readonly options: { client: { chat: (req: any) => Promise<{ content: string }> } }) {}

  async generate(query: string, chunks: Array<{ chunkId: string; text: string }>) {
    const response = await this.options.client.chat({ messages: [] })
    const parsed = this.tryParse(response.content)
    if (parsed) return parsed
    // single repair attempt
    const repair = await this.options.client.chat({ messages: [] })
    const repaired = this.tryParse(repair.content)
    if (repaired) return repaired
    throw new Error('Invalid generator output')
  }

  private tryParse(raw: string) {
    try {
      const json = JSON.parse(raw)
      if (!json.answer || !Array.isArray(json.sentences)) return null
      return json
    } catch {
      return null
    }
  }
}
