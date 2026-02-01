import { randomUUID } from 'crypto'
import type { Runner } from '../../../core/contracts/runner.js'
import type { AtomicTask } from '../../../core/contracts/task.js'
import type { RunRecord, TraceEvent } from '../../../core/contracts/run-record.js'
import type { ArtifactRecord } from '../../../core/contracts/artifact.js'
import bm25 from 'wink-bm25-text-search'
import winkTokenizer from 'wink-tokenizer'

const tokenizer = winkTokenizer().tokenize

type RagInput = {
  query: string
  retrieval?: { topK?: number }
}

type RagRunnerConfig = {
  dataset: { documents: Array<{ id: string; text: string }> }
  retriever: { type: 'bm25'; impl: 'wink'; topK?: number }
  generator: { type: 'template' | 'llm' }
}

export class RagBm25Runner implements Runner {
  id = 'rag.bm25'
  type = 'rag'
  version = '0.1.0'

  async execute(task: AtomicTask, config: RagRunnerConfig): Promise<RunRecord> {
    const startedAt = new Date()
    const trace: TraceEvent[] = []
    const runId = randomUUID()

    const input = task.input as RagInput
    const query = input.query
    const topKOverride = input.retrieval?.topK

    const topKUsed = topKOverride ?? config.retriever.topK ?? 5

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'retrieve',
      event: 'start',
      data: { topK: topKUsed }
    })

    const engine = bm25()
    engine.defineConfig({ fldWeights: { text: 1 } })
    engine.definePrepTasks([tokenizer])

    config.dataset.documents.forEach((doc, idx) => {
      engine.addDoc({ text: doc.text }, idx)
    })
    engine.consolidate()

    const results = engine.search(query, topKUsed)
    const retrievedChunks = results.map((result, index) => {
      const docIndex = result[0] as number
      const score = result[1] as number
      const doc = config.dataset.documents[docIndex]
      return {
        chunkId: doc.id,
        text: doc.text,
        score,
        rank: index + 1
      }
    })

    const retrievedArtifact: ArtifactRecord = {
      schemaId: 'rag.retrieved',
      producedByStepId: 'retrieve',
      payload: {
        query,
        topKUsed,
        chunks: retrievedChunks
      }
    }

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'retrieve',
      event: 'end',
      data: {
        topK: topKUsed,
        numDocs: config.dataset.documents.length,
        numResults: retrievedChunks.length
      }
    })

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'generate',
      event: 'start',
      data: { generatorType: config.generator.type }
    })

    const sentences = retrievedChunks.map((chunk, index) => ({
      sentenceId: `s${index + 1}`,
      text: chunk.text,
      citations: [{ chunkId: chunk.chunkId }]
    }))

    const answer = sentences.map(sentence => sentence.text).join(' ')

    const generatedOutput = {
      answer,
      sentences,
      generatorType: config.generator.type,
      sourcesUsed: Array.from(new Set(sentences.flatMap(sentence => sentence.citations.map(c => c.chunkId))))
    }

    const generatedArtifact: ArtifactRecord = {
      schemaId: 'rag.generated',
      producedByStepId: 'generate',
      payload: generatedOutput
    }

    trace.push({
      timestamp: new Date(),
      level: 'info',
      step: 'generate',
      event: 'end',
      data: {
        generatorType: config.generator.type,
        sentenceCount: sentences.length
      }
    })

    const completedAt = new Date()

    return {
      id: runId,
      taskId: task.id,
      taskType: 'atomic',
      status: 'completed',
      output: generatedOutput,
      metrics: {
        latency: completedAt.getTime() - startedAt.getTime()
      },
      trace,
      artifacts: [retrievedArtifact, generatedArtifact],
      startedAt,
      completedAt,
      provenance: {
        runnerId: this.id,
        runnerVersion: this.version,
        config
      }
    }
  }
}
