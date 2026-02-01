import { describe, it, expect } from 'vitest'
import { RagEvidenceReporter } from './reporters/rag-evidence-reporter.js'

const retrievedArtifact = (chunkIds: string[]) => ({
  schemaId: 'rag.retrieved',
  producedByStepId: 'retrieve',
  payload: { chunks: chunkIds.map(id => ({ chunkId: id, text: `chunk ${id}` })) }
})

const generatedArtifact = (
  sentences: Array<{ sentenceId: string; text: string; citations?: Array<{ chunkId: string }> }>
) => ({
  schemaId: 'rag.generated',
  producedByStepId: 'generate',
  payload: {
    answer: sentences.map(sentence => sentence.text).join(' '),
    sentences,
    generatorType: 'template',
    sourcesUsed: Array.from(new Set(sentences.flatMap(sentence => (sentence.citations ?? []).map(c => c.chunkId))))
  }
})

describe('RagEvidenceReporter', () => {
  it('classifies all linked citations as supported', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-1', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
          { sentenceId: 's1', text: 'Answer mentions c1', citations: [{ chunkId: 'c1' }] }
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
      method: 'strict',
      attempted: ['strict:proper_noun', 'strict:number']
    })
  })

  it('marks citations with missing chunks as unsupported', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-2', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
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
      reason: 'missing_chunk',
      attempted: ['strict:proper_noun', 'strict:number']
    })
  })

  it('treats empty citations as unlinked sentences', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-3', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
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

  it('marks citations with known chunk but no support as unsupported with no_support', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-4', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
          { sentenceId: 's4', text: 'Unmatched claim', citations: [{ chunkId: 'c1' }] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.supported).toHaveLength(0)
    expect(payload.unsupported).toHaveLength(1)
    expect(payload.unsupported[0]).toMatchObject({
      sentenceId: 's4',
      chunkId: 'c1',
      reason: 'no_support',
      attempted: ['strict:proper_noun', 'strict:number', 'semantic:fallback']
    })
  })

  it('computes citation and hallucination metrics', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-5', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
          { sentenceId: 's5', text: 'Answer mentions c1', citations: [{ chunkId: 'c1' }] },
          { sentenceId: 's6', text: 'Unmatched claim', citations: [{ chunkId: 'c1' }] },
          { sentenceId: 's7', text: 'No citations', citations: [] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.metrics).toMatchObject({
      citation_precision: 0.5,
      supported_sentence_rate: 1 / 3,
      hallucination_rate: 2 / 3,
      missing_evidence_rate: 1 / 3,
      wrong_evidence_rate: 1 / 3
    })
  })

  it('computes failure taxonomy with retrieval_attempted', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-6', {
      artifacts: [
        retrievedArtifact([]),
        generatedArtifact([
          { sentenceId: 's8', text: 'No citations', citations: [] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.taxonomy).toBe('retrieval_failed')
  })

  it('counts valid citations by distinct citation references', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-7', {
      artifacts: [
        retrievedArtifact(['c1', 'c2']),
        generatedArtifact([
          { sentenceId: 's9', text: 'Answer mentions c1 and c2', citations: [{ chunkId: 'c1' }, { chunkId: 'c2' }] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.metrics.citation_precision).toBe(1)
    expect(payload.validCitations).toBe(2)
  })

  it('includes sentences with text and citations in payload', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-8', {
      artifacts: [
        retrievedArtifact(['c1']),
        generatedArtifact([
          { sentenceId: 's10', text: 'Sentence text', citations: [{ chunkId: 'c1' }] }
        ])
      ]
    })

    const payload = reports[0].payload as any

    expect(payload.sentences).toEqual([
      { sentenceId: 's10', text: 'Sentence text', citations: [{ chunkId: 'c1' }] }
    ])
  })
})
