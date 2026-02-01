import type { Reporter, ReportRecord } from '../../../core/contracts/report.js'
import type { ArtifactRecord } from '../../../core/contracts/artifact.js'
import type {
  RagEvidenceLink,
  RagEvidenceReportPayload,
  RagSentence,
  RagUnsupportedLink
} from '../schemas.js'

const properNounPattern = /[A-Z][A-Za-z0-9-]+/g
const numberPattern = /\d+(?:\.\d+)?%?/g

const extractTokens = (text: string, pattern: RegExp): string[] => {
  const matches = text.match(pattern)
  return matches ? matches.map(match => match.toLowerCase()) : []
}

const hasOverlap = (left: string[], right: string[]): boolean => {
  const rightSet = new Set(right)
  return left.some(token => rightSet.has(token))
}

const strictMatch = (sentence: string, chunkText: string): { matched: boolean; attempted: string[] } => {
  const attempted = ['strict:proper_noun', 'strict:number']
  const sentenceProperNouns = extractTokens(sentence, properNounPattern)
  const chunkProperNouns = extractTokens(chunkText, properNounPattern)

  if (hasOverlap(sentenceProperNouns, chunkProperNouns)) {
    return { matched: true, attempted }
  }

  const sentenceNumbers = extractTokens(sentence, numberPattern)
  const chunkNumbers = extractTokens(chunkText, numberPattern)

  if (hasOverlap(sentenceNumbers, chunkNumbers)) {
    return { matched: true, attempted }
  }

  return { matched: false, attempted }
}

type RagEvidenceMetrics = {
  citation_precision: number
  supported_sentence_rate: number
  hallucination_rate: number
  missing_evidence_rate: number
  wrong_evidence_rate: number
}

type RagFailureTaxonomy = 'retrieval_failed' | 'evidence_link_failed' | 'generation_failed' | 'unknown'

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
    const retrievedChunkMap = new Map(
      retrievedChunks
        .filter((chunk: any) => chunk && typeof chunk.id === 'string')
        .map((chunk: any) => [chunk.id as string, chunk])
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
        const chunk = retrievedChunkMap.get(citation.chunkId)
        if (!chunk) {
          unsupported.push({
            sentenceId: sentence.sentenceId,
            chunkId: citation.chunkId,
            producedByStepId: citationsArtifact?.producedByStepId ?? 'generate',
            method: 'strict',
            attempted: ['strict:proper_noun', 'strict:number'],
            reason: 'missing_chunk'
          })
          continue
        }

        const chunkText = typeof chunk.text === 'string' ? chunk.text : ''
        const strict = strictMatch(sentence.text, chunkText)

        if (strict.matched) {
          supported.push({
            sentenceId: sentence.sentenceId,
            chunkId: citation.chunkId,
            producedByStepId: citationsArtifact?.producedByStepId ?? 'generate',
            method: 'strict',
            attempted: strict.attempted
          })
          continue
        }

        unsupported.push({
          sentenceId: sentence.sentenceId,
          chunkId: citation.chunkId,
          producedByStepId: citationsArtifact?.producedByStepId ?? 'generate',
          method: 'semantic',
          attempted: [...strict.attempted, 'semantic:fallback'],
          reason: 'no_support'
        })
      }
    }

    const totalSentences = sentences.length
    const sentencesWithCitations = sentences.filter(s => (s.citations ?? []).length > 0).length
    const totalCitations = sentences.reduce(
      (sum, sentence) => sum + (sentence.citations ?? []).length,
      0
    )

    const unlinkedCount = unlinkedSentences.length
    const unsupportedCount = unsupported.length
    const supportedCount = supported.length

    const validCitations = new Set(supported.map(link => link.chunkId)).size

    const metrics: RagEvidenceMetrics = {
      citation_precision: totalCitations === 0 ? 0 : validCitations / totalCitations,
      supported_sentence_rate: totalSentences === 0 ? 0 : supportedCount / totalSentences,
      hallucination_rate: totalSentences === 0 ? 0 : (unlinkedCount + unsupportedCount) / totalSentences,
      missing_evidence_rate: totalSentences === 0 ? 0 : unlinkedCount / totalSentences,
      wrong_evidence_rate: totalSentences === 0 ? 0 : unsupportedCount / totalSentences
    }

    const retrievalAttempted = retrievedArtifact?.producedByStepId === 'retrieve'
    let taxonomy: RagFailureTaxonomy = 'unknown'

    if (retrievalAttempted && retrievedChunks.length === 0) {
      taxonomy = 'retrieval_failed'
    } else if (supported.length === 0 && sentencesWithCitations > 0) {
      taxonomy = 'evidence_link_failed'
    }

    const payload: RagEvidenceReportPayload & {
      metrics: RagEvidenceMetrics
      taxonomy: RagFailureTaxonomy
      validCitations: number
    } = {
      totalSentences,
      sentencesWithCitations,
      totalCitations,
      sentences,
      supported,
      unsupported,
      unlinkedSentences,
      metrics,
      taxonomy,
      validCitations
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
