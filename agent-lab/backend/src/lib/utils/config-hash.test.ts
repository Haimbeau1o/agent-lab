import { describe, it, expect } from 'vitest'
import { createConfigHash, createRunFingerprint } from './config-hash.js'

describe('config hash', () => {
  it('is stable across key order', () => {
    const a = { task: { id: 't1', type: 'rag' }, model: { name: 'gpt' } }
    const b = { model: { name: 'gpt' }, task: { type: 'rag', id: 't1' } }
    expect(createConfigHash(a)).toBe(createConfigHash(b))
  })

  it('changes when values change', () => {
    const a = { task: { id: 't1' } }
    const b = { task: { id: 't2' } }
    expect(createConfigHash(a)).not.toBe(createConfigHash(b))
  })

  it('run fingerprint includes env overrides', () => {
    const base = { task: { id: 't1' }, env: { llm: 'gpt-5' } }
    const other = { task: { id: 't1' }, env: { llm: 'gpt-4' } }
    expect(createRunFingerprint(base)).not.toBe(createRunFingerprint(other))
  })
})
