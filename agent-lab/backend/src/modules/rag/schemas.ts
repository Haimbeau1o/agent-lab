export const RagArtifactSchemas = {
  retrieved: { id: 'rag.retrieved', name: 'RetrievedChunks', version: '1.0.0' },
  reranked: { id: 'rag.reranked', name: 'RerankedChunks', version: '1.0.0' },
  generated: { id: 'rag.generated', name: 'GeneratedAnswer', version: '1.0.0' }
}

export type RagCitationRef = {
  chunkId: string
  span?: { start: number; end: number }
  alignmentId?: string
}

export type RagSentence = {
  sentenceId: string
  text: string
  citations?: RagCitationRef[]
}

export type RagGeneratedOutput = {
  answer: string
  sentences: RagSentence[]
  generatorType: 'template' | 'llm'
  sourcesUsed: string[]
}

export type RagEvidenceLink = {
  sentenceId: string
  chunkId: string
  producedByStepId: string
  method: 'strict' | 'semantic'
  confidence?: number
  attempted?: string[]
  span?: { start: number; end: number }
  alignmentId?: string
}

export type RagUnsupportedLink = RagEvidenceLink & {
  reason: 'missing_chunk' | 'no_support' | 'conflict' | 'low_confidence'
}

export type RagEvidenceReportPayload = {
  totalSentences: number
  sentencesWithCitations: number
  totalCitations: number
  sentences: RagSentence[]
  supported: RagEvidenceLink[]
  unsupported: RagUnsupportedLink[]
  unlinkedSentences: RagSentence[]
}
