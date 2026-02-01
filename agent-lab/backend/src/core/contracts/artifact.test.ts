import { describe, it, expect } from 'vitest'
import { assertArtifactRecord } from './artifact.js'

describe('artifact validation', () => {
  it('requires schemaId and producedByStepId when provided', () => {
    expect(() => assertArtifactRecord({} as any)).toThrow('schemaId')
    expect(() => assertArtifactRecord({ schemaId: 'rag.retrieved' } as any)).toThrow('producedByStepId')
  })

  it('accepts minimal valid record', () => {
    const record = {
      schemaId: 'rag.retrieved',
      producedByStepId: 'retrieve',
      payload: { chunks: [] }
    }
    expect(() => assertArtifactRecord(record)).not.toThrow()
  })
})
