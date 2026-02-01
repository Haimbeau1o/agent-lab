import { createHash } from 'crypto'
import { stableStringify } from './stable-stringify.js'

export function createConfigHash(snapshot: Record<string, unknown>): string {
  const normalized = stableStringify(snapshot)
  return createHash('sha256').update(normalized).digest('hex')
}

export function createRunFingerprint(snapshot: Record<string, unknown>): string {
  return createConfigHash(snapshot)
}
