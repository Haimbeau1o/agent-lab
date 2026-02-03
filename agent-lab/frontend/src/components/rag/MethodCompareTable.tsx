import React from 'react'

type Score = {
  metric: string
  value: number | string
}

type RunSummary = {
  id: string
  runnerId: string
  scores: Score[]
}

type Props = {
  runs: RunSummary[]
}

export function MethodCompareTable({ runs }: Props) {
  return (
    <div className="glass-card p-4">
      <p className="text-sm font-semibold text-white mb-3">Method Comparison</p>
      <table className="w-full text-sm text-slate-200">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left py-2">Runner</th>
            <th className="text-left py-2">Metrics</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr key={run.id} className="border-t border-white/5">
              <td className="py-2 text-white">{run.runnerId}</td>
              <td className="py-2">
                {run.scores.map(score => (
                  <span key={score.metric} className="mr-3 text-xs text-slate-300">
                    {score.metric}: {score.value}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
