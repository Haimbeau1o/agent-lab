import { describe, it, expect } from 'vitest'
import { RagEvidenceReporter } from './reporters/rag-evidence-reporter.js'

const retrievedArtifact = (chunkIds: string[]) => ({
  schemaId: 'rag.retrieved',
  producedByStepId: 'retrieve',
  payload: { chunks: chunkIds.map(id => ({ id, text: `chunk ${id}` })) }
})

const citationsArtifact = (
  sentences: Array<{ sentenceId: string; text: string; citations?: Array<{ chunkId: string }> }>
) => ({
  schemaId: 'rag.citations',
  producedByStepId: 'generate',
  payload: { sentences }
})

describe('RagEvidenceReporter', () => {
  it('classifies all linked citations as supported', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-1', {
      artifacts: [
        retrievedArtifact(['c1']),
        citationsArtifact([
          { sentenceId: 's1', text: 'Answer sentence', citations: [{ chunkId: 'c1' }] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.totalSentences).toBe(1)
    expect(payload.sentencesWithCitations).toBe(1)
    expect(payload.totalCitations).toBe(1)
    expect(payload.supported).toHaveLength(1)
    expect(payload.unsupported).toHaveLength(0)
    expect(payload.unlinkedSentences).toHaveLength(0)
    expect(payload.supported[0]).toMatchObject({
      sentenceId: 's1',
      chunkId: 'c1',
      producedByStepId: 'generate',
      method: 'strict'
    })
  })

  it('marks citations with missing chunks as unsupported', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-2', {
      artifacts: [
        retrievedArtifact(['c1']),
        citationsArtifact([
          { sentenceId: 's2', text: 'Another sentence', citations: [{ chunkId: 'c2' }] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.supported).toHaveLength(0)
    expect(payload.unsupported).toHaveLength(1)
    expect(payload.unsupported[0]).toMatchObject({
      sentenceId: 's2',
      chunkId: 'c2',
      reason: 'missing_chunk'
    })
  })

  it('treats empty citations as unlinked sentences', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-3', {
      artifacts: [
        retrievedArtifact(['c1']),
        citationsArtifact([
          { sentenceId: 's3', text: 'No citations', citations: [] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.totalSentences).toBe(1)
    expect(payload.sentencesWithCitations).toBe(0)
    expect(payload.totalCitations).toBe(0)
    expect(payload.unlinkedSentences).toHaveLength(1)
    expect(payload.unlinkedSentences[0]).toMatchObject({
      sentenceId: 's3',
      text: 'No citations'
    })
  })
})
