import { randomUUID } from 'crypto'
import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'

export class RagMockRunner implements Runner {
  id = 'rag.mock'
  type = 'rag'
  version = '0.1.0'

  async execute(task: AtomicTask): Promise<RunRecord> {
    return {
      id: randomUUID(),
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: { answer: 'ok' },
      metrics: { latency: 1 },
      trace: [],
      artifacts: [
        { schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: { chunks: [] } },
        { schemaId: 'rag.citations', producedByStepId: 'generate', payload: { citations: [] } }
      ],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: this.id,
        runnerVersion: this.version,
        config: {}
      }
    }
  }
}
