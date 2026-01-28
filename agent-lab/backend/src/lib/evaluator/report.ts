import type { TestResult, EvaluationReport, IntentMetrics, DialogueMetrics, MemoryMetrics } from '../../types/result.js'
import { calculateIntentMetrics } from './intent-metrics.js'
import { calculateDialogueMetrics } from './dialogue-metrics.js'
import { calculateMemoryMetrics } from './memory-metrics.js'

export function generateReport(
  testRunId: string,
  agentType: 'intent' | 'dialogue' | 'memory',
  results: TestResult[]
): EvaluationReport {
  let metrics: IntentMetrics | DialogueMetrics | MemoryMetrics
  let summary: string
  const issues: string[] = []
  const recommendations: string[] = []

  if (agentType === 'intent') {
    metrics = calculateIntentMetrics(results)
    summary = generateIntentSummary(metrics, results)
    issues.push(...identifyIntentIssues(metrics))
    recommendations.push(...generateIntentRecommendations(metrics))
  } else if (agentType === 'dialogue') {
    metrics = calculateDialogueMetrics(results)
    summary = generateDialogueSummary(metrics, results)
    issues.push(...identifyDialogueIssues(metrics))
    recommendations.push(...generateDialogueRecommendations(metrics))
  } else {
    metrics = calculateMemoryMetrics(results)
    summary = generateMemorySummary(metrics, results)
    issues.push(...identifyMemoryIssues(metrics))
    recommendations.push(...generateMemoryRecommendations(metrics))
  }

  return {
    testRunId,
    summary,
    metrics,
    issues,
    recommendations,
    createdAt: new Date()
  }
}

function generateIntentSummary(metrics: IntentMetrics, results: TestResult[]): string {
  const totalTests = results.length
  const successfulTests = results.filter(r => r.isCorrect === true).length

  return `Intent Recognition Test completed with ${successfulTests}/${totalTests} successful recognitions (${(metrics.accuracy * 100).toFixed(1)}% accuracy).

Average confidence score: ${(metrics.avgConfidence * 100).toFixed(1)}%
Average latency: ${metrics.latency}ms
F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%

The model shows ${metrics.accuracy > 0.8 ? 'strong' : metrics.accuracy > 0.6 ? 'moderate' : 'weak'} performance in identifying user intents.`
}

function identifyIntentIssues(metrics: IntentMetrics): string[] {
  const issues: string[] = []

  if (metrics.accuracy < 0.7) {
    issues.push(`Low accuracy (${(metrics.accuracy * 100).toFixed(1)}%) - Many intents are being misclassified`)
  }

  if (metrics.avgConfidence < 0.6) {
    issues.push(`Low confidence scores (avg ${(metrics.avgConfidence * 100).toFixed(1)}%) - Model is uncertain about predictions`)
  }

  if (metrics.latency > 2000) {
    issues.push(`High latency (${metrics.latency}ms) - Response time may impact user experience`)
  }

  return issues
}

function generateIntentRecommendations(metrics: IntentMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.accuracy < 0.7) {
    recommendations.push('Add more few-shot examples to improve intent discrimination')
    recommendations.push('Consider using a more powerful model for better understanding')
  }

  if (metrics.avgConfidence < 0.6) {
    recommendations.push('Refine intent definitions to reduce ambiguity')
    recommendations.push('Add clarification questions for low-confidence predictions')
  }

  if (metrics.latency > 2000) {
    recommendations.push('Reduce context length or use a faster model')
    recommendations.push('Implement caching for common queries')
  }

  return recommendations
}

function generateDialogueSummary(metrics: DialogueMetrics, results: TestResult[]): string {
  const totalTests = results.length

  return `Multi-turn Dialogue Test completed with ${totalTests} conversation scenarios.

Coherence Score: ${(metrics.coherenceScore * 100).toFixed(1)}%
Context Retention: ${(metrics.contextRetention * 100).toFixed(1)}%
Task Completion Rate: ${(metrics.taskCompletionRate * 100).toFixed(1)}%
Average Turns: ${metrics.avgTurnsToComplete}
Latency per Turn: ${metrics.latencyPerTurn}ms

The dialogue manager maintains ${metrics.coherenceScore > 0.7 ? 'good' : 'moderate'} conversational flow.`
}

function identifyDialogueIssues(metrics: DialogueMetrics): string[] {
  const issues: string[] = []

  if (metrics.coherenceScore < 0.6) {
    issues.push('Low coherence score - Conversations may lack logical flow')
  }

  if (metrics.contextRetention < 0.5) {
    issues.push('Poor context retention - Important information is being lost across turns')
  }

  if (metrics.taskCompletionRate < 0.7) {
    issues.push('Low task completion rate - Many conversations fail to reach their goal')
  }

  if (metrics.latencyPerTurn > 3000) {
    issues.push(`High latency per turn (${metrics.latencyPerTurn}ms) - May frustrate users`)
  }

  return issues
}

function generateDialogueRecommendations(metrics: DialogueMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.coherenceScore < 0.6) {
    recommendations.push('Improve system prompt to emphasize contextual awareness')
  }

  if (metrics.contextRetention < 0.5) {
    recommendations.push('Increase context window size or implement better context management')
  }

  if (metrics.taskCompletionRate < 0.7) {
    recommendations.push('Add explicit goal tracking and confirmation steps')
  }

  return recommendations
}

function generateMemorySummary(metrics: MemoryMetrics, results: TestResult[]): string {
  const totalTests = results.length

  return `Memory Test completed with ${totalTests} recall scenarios.

Recall Accuracy: ${(metrics.recallAccuracy * 100).toFixed(1)}%
Storage Efficiency: ${(metrics.storageEfficiency * 100).toFixed(1)}%
Retrieval Relevance: ${(metrics.retrievalRelevance * 100).toFixed(1)}%
Average Memory Size: ${metrics.memorySize} items
Average Retrieval Time: ${metrics.avgRetrievalTime}ms

The memory system shows ${metrics.recallAccuracy > 0.7 ? 'strong' : 'moderate'} ability to retain and recall information.`
}

function identifyMemoryIssues(metrics: MemoryMetrics): string[] {
  const issues: string[] = []

  if (metrics.recallAccuracy < 0.6) {
    issues.push('Low recall accuracy - Important information is not being remembered correctly')
  }

  if (metrics.storageEfficiency < 0.5) {
    issues.push('Low storage efficiency - Too much irrelevant information is being stored')
  }

  if (metrics.avgRetrievalTime > 2000) {
    issues.push(`High retrieval time (${metrics.avgRetrievalTime}ms) - Memory lookup is slow`)
  }

  return issues
}

function generateMemoryRecommendations(metrics: MemoryMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.recallAccuracy < 0.6) {
    recommendations.push('Improve memory extraction prompt to capture key information')
    recommendations.push('Add importance weighting to prioritize critical facts')
  }

  if (metrics.storageEfficiency < 0.5) {
    recommendations.push('Implement better filtering to reduce noise in stored memories')
  }

  if (metrics.avgRetrievalTime > 2000) {
    recommendations.push('Consider implementing vector-based semantic search')
    recommendations.push('Add indexing for faster keyword matching')
  }

  return recommendations
}
