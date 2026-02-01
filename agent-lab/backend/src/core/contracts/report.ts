import type { ArtifactRecord } from './artifact.js'

export interface ReportRecord {
  id: string
  runId: string
  type: string
  payload: Record<string, unknown>
  producedAt: Date
}

export interface Reporter {
  id: string
  types: string[]
  run(
    runId: string,
    context: {
      runOutput?: unknown
      artifacts?: ArtifactRecord[]
      trace?: unknown[]
    }
  ): Promise<ReportRecord[]>
}
