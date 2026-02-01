import type { Reporter, ReportRecord } from '../../../core/contracts/report.js'
import type { ArtifactRecord } from '../../../core/contracts/artifact.js'
import type {
  RagEvidenceLink,
  RagEvidenceReportPayload,
  RagSentence,
  RagUnsupportedLink
} from '../schemas.js'

export class RagEvidenceReporter implements Reporter {
  id = 'rag.evidence'
  types = ['rag.evidence']

  async run(runId: string, context: { artifacts?: ArtifactRecord[] }): Promise<ReportRecord[]> {
    const artifacts = context.artifacts ?? []
    const retrievedArtifact = artifacts.find(a => a.schemaId === 'rag.retrieved')
    const citationsArtifact = artifacts.find(a => a.schemaId === 'rag.citations')

    const retrievedChunks = Array.isArray(retrievedArtifact?.payload?.chunks)
      ? retrievedArtifact?.payload?.chunks
      : []
    const retrievedChunkIds = new Set(
      retrievedChunks
        .map((chunk: any) => chunk?.id)
        .filter((id: unknown): id is string => typeof id === 'string')
    )

    const sentences: RagSentence[] = Array.isArray(citationsArtifact?.payload?.sentences)
      ? (citationsArtifact?.payload?.sentences as RagSentence[])
      : []

    const supported: RagEvidenceLink[] = []
    const unsupported: RagUnsupportedLink[] = []
    const unlinkedSentences: RagSentence[] = []

    for (const sentence of sentences) {
      const citations = sentence.citations ?? []
      if (citations.length === 0) {
        unlinkedSentences.push({ sentenceId: sentence.sentenceId, text: sentence.text })
        continue
      }

      for (const citation of citations) {
        if (!retrievedChunkIds.has(citation.chunkId)) {
          unsupported.push({
            sentenceId: sentence.sentenceId,
            chunkId: citation.chunkId,
            producedByStepId: citationsArtifact?.producedByStepId ?? 'generate',
            method: 'strict',
            attempted: ['strict:proper_noun'],
            reason: 'missing_chunk'
          })
          continue
        }

        supported.push({
          sentenceId: sentence.sentenceId,
          chunkId: citation.chunkId,
          producedByStepId: citationsArtifact?.producedByStepId ?? 'generate',
          method: 'strict',
          attempted: ['strict:proper_noun']
        })
      }
    }

    const totalSentences = sentences.length
    const sentencesWithCitations = sentences.filter(s => (s.citations ?? []).length > 0).length
    const totalCitations = sentences.reduce(
      (sum, sentence) => sum + (sentence.citations ?? []).length,
      0
    )

    const payload: RagEvidenceReportPayload = {
      totalSentences,
      sentencesWithCitations,
      totalCitations,
      sentences,
      supported,
      unsupported,
      unlinkedSentences
    }

    return [
      {
        id: `rep-${runId}`,
        runId,
        type: 'rag.evidence',
        payload,
        producedAt: new Date()
      }
    ]
  }
}
