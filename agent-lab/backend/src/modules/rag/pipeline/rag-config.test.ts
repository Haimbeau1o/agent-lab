import { describe, it, expect } from 'vitest'
import { buildRagConfig } from './rag-config.js'

describe('buildRagConfig', () => {
  it('applies defaults and preserves append-only fields', () => {
    const cfg = buildRagConfig({ generator: { type: 'template' } })
    expect(cfg.chunking.strategy).toBe('doc')
    expect(cfg.retriever.type).toBe('bm25')
  })
})
