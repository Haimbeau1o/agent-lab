import { describe, it, expect } from 'vitest'
import { RagEvidenceReporter } from './reporters/rag-evidence-reporter.js'

describe('RagEvidenceReporter', () => {
  it('links citations to retrieved chunks', async () => {
    const reporter = new RagEvidenceReporter()
    const reports = await reporter.run('run-1', {
      artifacts: [
        {
          schemaId: 'rag.retrieved',
          producedByStepId: 'retrieve',
          payload: { chunks: [{ id: 'c1', text: 'hello' }] }
        },
        {
          schemaId: 'rag.citations',
          producedByStepId: 'generate',
          payload: { citations: [{ chunkId: 'c1' }] }
        }
      ]
    })

    expect(reports[0].type).toBe('rag.evidence')
  })
})
