import { randomUUID } from 'crypto'
import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord } from '../../../core/contracts/run-record.js'

export class RagMockRunner implements Runner {
  id = 'rag.mock'
  type = 'rag'
  version = '0.1.0'

  async execute(task: AtomicTask): Promise<RunRecord> {
    const sentences = [
      { sentenceId: 's1', text: 'ok', citations: [{ chunkId: 'c1' }] }
    ]

    const output = {
      answer: 'ok',
      sentences,
      generatorType: 'template',
      sourcesUsed: ['c1']
    }

    return {
      id: randomUUID(),
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output,
      metrics: { latency: 1 },
      trace: [],
      artifacts: [
        { schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: { chunks: [] } },
        { schemaId: 'rag.generated', producedByStepId: 'generate', payload: output }
      ],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: { runnerId: this.id, runnerVersion: this.version, config: {} }
    }
  }
}
