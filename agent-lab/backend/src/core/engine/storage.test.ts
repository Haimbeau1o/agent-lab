import { describe, it, expect } from 'vitest'
import { InMemoryStorage } from './storage.js'

it('preserves artifacts and reports on save/get', async () => {
  const storage = new InMemoryStorage()
  const run = {
    id: 'run-1',
    taskId: 'task-1',
    taskType: 'atomic',
    status: 'completed',
    metrics: { latency: 1 },
    trace: [],
    startedAt: new Date(),
    provenance: {
      runnerId: 'r',
      runnerVersion: '1',
      config: {},
      configHash: 'x',
      runFingerprint: 'y'
    },
    artifacts: [{ schemaId: 'rag.retrieved', producedByStepId: 'retrieve', payload: {} }],
    reports: [{ id: 'rep-1', runId: 'run-1', type: 'rag.evidence', payload: {}, producedAt: new Date() }]
  }

  await storage.saveRun(run as any)
  const saved = await storage.getRun('run-1')

  expect(saved?.artifacts?.length).toBe(1)
  expect(saved?.reports?.length).toBe(1)
})
