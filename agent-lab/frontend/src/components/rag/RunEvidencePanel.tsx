import React from 'react'

type EvidenceLink = {
  sentenceId: string
  chunkId: string
  span?: { start: number; end: number }
}

type Sentence = {
  sentenceId: string
  text: string
  citations?: { chunkId: string }[]
}

type RagEvidencePayload = {
  sentences: Sentence[]
  supported: EvidenceLink[]
  unsupported: EvidenceLink[]
  unlinkedSentences: Sentence[]
  metrics: Record<string, number>
}

type Props = {
  payload: RagEvidencePayload | null
}

export function RunEvidencePanel({ payload }: Props) {
  if (!payload) {
    return <div className="text-sm text-slate-400">No evidence report available.</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">citation_precision</p>
          <p className="text-2xl font-bold text-white">{payload.metrics.citation_precision?.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">hallucination_rate</p>
          <p className="text-2xl font-bold text-white">{payload.metrics.hallucination_rate?.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="text-sm font-semibold text-white mb-2">Sentences</p>
        <div className="space-y-2">
          {payload.sentences.map(sentence => (
            <div key={sentence.sentenceId} className="text-sm text-slate-200">
              <span className="text-slate-400 mr-2">{sentence.sentenceId}</span>
              {sentence.text}
              <span className="ml-2 text-xs text-slate-400">
                citations: {(sentence.citations ?? []).map(c => c.chunkId).join(', ') || 'none'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-white mb-2">Supported</p>
          {payload.supported.map(link => (
            <div key={`${link.sentenceId}-${link.chunkId}`} className="text-xs text-emerald-300">
              {link.sentenceId} → {link.chunkId} {link.span ? `(span ${link.span.start}-${link.span.end})` : ''}
            </div>
          ))}
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-white mb-2">Unsupported</p>
          {payload.unsupported.map(link => (
            <div key={`${link.sentenceId}-${link.chunkId}`} className="text-xs text-rose-300">
              {link.sentenceId} → {link.chunkId}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
