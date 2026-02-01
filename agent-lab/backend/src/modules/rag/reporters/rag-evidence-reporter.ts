import type { Reporter, ReportRecord } from '../../../core/contracts/report.js'
import type { ArtifactRecord } from '../../../core/contracts/artifact.js'

export class RagEvidenceReporter implements Reporter {
  id = 'rag.evidence'
  types = ['rag.evidence']

  async run(runId: string, context: { artifacts?: ArtifactRecord[] }): Promise<ReportRecord[]> {
    return [
      {
        id: `rep-${runId}`,
        runId,
        type: 'rag.evidence',
        payload: {
          linked: true,
          artifacts: context.artifacts ?? []
        },
        producedAt: new Date()
      }
    ]
  }
}
