export interface ArtifactSchema {
  id: string
  name: string
  version: string
  description?: string
}

export interface ArtifactRecord {
  schemaId: string
  producedByStepId: string
  payload: Record<string, unknown>
  metadata?: {
    source_id?: string
    span?: string
    score?: number
    provenance?: string
    alignment_id?: string
  }
}

export function assertArtifactRecord(record: ArtifactRecord): void {
  if (!record.schemaId) throw new Error('schemaId is required')
  if (!record.producedByStepId) throw new Error('producedByStepId is required')
}
