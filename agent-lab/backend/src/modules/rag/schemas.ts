export const RagArtifactSchemas = {
  retrieved: { id: 'rag.retrieved', name: 'RetrievedChunks', version: '1.0.0' },
  citations: { id: 'rag.citations', name: 'FinalCitations', version: '1.0.0' }
}

export type RagCitationRef = {
  chunkId: string
}

export type RagSentence = {
  sentenceId: string
  text: string
  citations?: RagCitationRef[]
}

export type RagEvidenceLink = {
  sentenceId: string
  chunkId: string
  producedByStepId: string
  method: 'strict' | 'semantic'
  confidence?: number
  attempted?: string[]
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
