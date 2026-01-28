import type { TestResult, DialogueMetrics } from '../../types/result.js'

export function calculateDialogueMetrics(results: TestResult[]): DialogueMetrics {
  const validResults = results.filter(r => !r.metrics || !('error' in (r.metrics as Record<string, unknown>)))

  if (validResults.length === 0) {
    return {
      coherenceScore: 0,
      topicDriftCount: 0,
      contextRetention: 0,
      taskCompletionRate: 0,
      avgTurnsToComplete: 0,
      repeatRate: 0,
      latencyPerTurn: 0
    }
  }

  // Calculate average latency per turn
  const totalLatency = validResults.reduce((sum, r) => sum + r.latency, 0)
  const totalTurns = validResults.reduce((sum, r) => {
    const metrics = r.metrics as Record<string, unknown>
    return sum + (typeof metrics.turnCount === 'number' ? metrics.turnCount : 1)
  }, 0)

  const latencyPerTurn = totalLatency / totalTurns

  // Calculate average turns to complete
  const avgTurnsToComplete = totalTurns / validResults.length

  // Simple heuristics for other metrics
  const coherenceScore = 0.8 // Placeholder - would need semantic analysis
  const contextRetention = 0.75 // Placeholder
  const taskCompletionRate = validResults.filter(r => r.isCorrect !== false).length / validResults.length

  return {
    coherenceScore,
    topicDriftCount: 0,
    contextRetention,
    taskCompletionRate,
    avgTurnsToComplete: Math.round(avgTurnsToComplete * 10) / 10,
    repeatRate: 0,
    latencyPerTurn: Math.round(latencyPerTurn)
  }
}
