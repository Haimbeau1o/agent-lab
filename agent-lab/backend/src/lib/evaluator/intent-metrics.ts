import type { TestResult } from '../../types/result.js'
import type { IntentMetrics } from '../../types/result.js'

export function calculateIntentMetrics(results: TestResult[]): IntentMetrics {
  const validResults = results.filter(r => !r.metrics || !('error' in (r.metrics as Record<string, unknown>)))

  if (validResults.length === 0) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      avgConfidence: 0,
      latency: 0
    }
  }

  // Calculate accuracy
  const correctCount = validResults.filter(r => r.isCorrect === true).length
  const accuracy = correctCount / validResults.length

  // Calculate average confidence
  let totalConfidence = 0
  for (const result of validResults) {
    const metrics = result.metrics as Record<string, unknown>
    if (typeof metrics.confidence === 'number') {
      totalConfidence += metrics.confidence
    }
  }
  const avgConfidence = totalConfidence / validResults.length

  // Calculate average latency
  const avgLatency = validResults.reduce((sum, r) => sum + r.latency, 0) / validResults.length

  // For simplicity, precision and recall are set equal to accuracy
  // In a real implementation, you would need true/false positives/negatives per intent
  const precision = accuracy
  const recall = accuracy
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    avgConfidence,
    latency: Math.round(avgLatency)
  }
}

// Calculate confusion matrix if you have intent labels
export function calculateConfusionMatrix(
  results: TestResult[],
  intents: string[]
): number[][] {
  const matrix: number[][] = Array(intents.length).fill(0).map(() => Array(intents.length).fill(0))

  for (const result of results) {
    if (result.isCorrect === null || !result.expected) continue

    const metrics = result.metrics as Record<string, unknown>
    const output = result.output as Record<string, unknown>

    const actualIntent = (metrics.intent || output.intent) as string
    const expectedIntent = (result.expected as Record<string, unknown>).intent as string

    const actualIndex = intents.indexOf(actualIntent)
    const expectedIndex = intents.indexOf(expectedIntent)

    if (actualIndex >= 0 && expectedIndex >= 0) {
      matrix[expectedIndex][actualIndex]++
    }
  }

  return matrix
}
