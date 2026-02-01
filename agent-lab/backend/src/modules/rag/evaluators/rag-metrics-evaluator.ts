import type { Evaluator } from '../../../core/contracts/evaluator.js'
import type { ReportRecord } from '../../../core/contracts/report.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { ScoreRecord } from '../../../core/contracts/score-record.js'

export class RagMetricsEvaluator implements Evaluator {
  id = 'rag.metrics'
  metrics = ['citation_precision']

  async evaluate(
    run: RunRecord,
    _task: AtomicTask,
    reports?: ReportRecord[]
  ): Promise<ScoreRecord[]> {
    return [
      {
        id: `score-${run.id}`,
        runId: run.id,
        metric: 'citation_precision',
        value: 1,
        target: 'final',
        evidence: {
          reportRefs: reports?.map(report => report.id) ?? []
        },
        evaluatorId: this.id,
        createdAt: new Date()
      }
    ]
  }
}
