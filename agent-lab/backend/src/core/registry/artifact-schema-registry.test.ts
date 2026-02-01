import { describe, it, expect } from 'vitest'
import { ArtifactSchemaRegistry } from './artifact-schema-registry.js'

const schema = { id: 'rag.retrieved', name: 'RetrievedChunks', version: '1.0.0' }

describe('ArtifactSchemaRegistry', () => {
  it('registers and retrieves schema', () => {
    const registry = new ArtifactSchemaRegistry()
    registry.register(schema)
    expect(registry.get('rag.retrieved')).toEqual(schema)
  })
})
