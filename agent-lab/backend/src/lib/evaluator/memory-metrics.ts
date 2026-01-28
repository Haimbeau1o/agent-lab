import type { TestResult, MemoryMetrics } from '../../types/result.js'

export function calculateMemoryMetrics(results: TestResult[]): MemoryMetrics {
  const validResults = results.filter(r => !r.metrics || !('error' in (r.metrics as Record<string, unknown>)))

  if (validResults.length === 0) {
    return {
      recallAccuracy: 0,
      storageEfficiency: 0,
      retrievalRelevance: 0,
      updateLatency: 0,
      memorySize: 0,
      avgRetrievalTime: 0
    }
  }

  // Calculate average recall accuracy
  let totalAccuracy = 0
  let totalMemorySize = 0

  for (const result of validResults) {
    const metrics = result.metrics as Record<string, unknown>
    const output = result.output as Record<string, unknown>
    const expected = result.expected as Record<string, unknown> | null

    if (expected && Array.isArray(expected.recall) && Array.isArray(output.recalled)) {
      const recalledKeys = (output.recalled as Array<{ key: string }>).map(m => m.key)
      const expectedRecalls = expected.recall as string[]
      const correctRecalls = expectedRecalls.filter(key => recalledKeys.includes(key))
      const accuracy = correctRecalls.length / expectedRecalls.length
      totalAccuracy += accuracy
    }

    if (typeof metrics.recalledCount === 'number') {
      totalMemorySize += metrics.recalledCount
    }
  }

  const recallAccuracy = totalAccuracy / validResults.length
  const avgMemorySize = Math.round(totalMemorySize / validResults.length)

  // Calculate average retrieval time
  const avgRetrievalTime = Math.round(
    validResults.reduce((sum, r) => sum + r.latency, 0) / validResults.length
  )

  return {
    recallAccuracy,
    storageEfficiency: 0.8, // Placeholder
    retrievalRelevance: recallAccuracy,
    updateLatency: avgRetrievalTime,
    memorySize: avgMemorySize,
    avgRetrievalTime
  }
}
