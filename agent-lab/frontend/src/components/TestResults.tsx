import { EvaluationReport } from '../types/api';

interface TestResultsProps {
    report: EvaluationReport | null;
}

export function TestResults({ report }: TestResultsProps) {
    if (!report) return null;

    return (
        <div className="mt-6 glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">评测报告</h2>

            <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">总结</h3>
                <p className="text-zinc-300 bg-zinc-900/50 border border-zinc-800 p-4 rounded-md">{report.summary}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(report.metrics).map(([key, value]) => (
                    <div key={key} className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <div className="text-xs text-indigo-400 uppercase tracking-wide mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {typeof value === 'number'
                                ? (value < 1 && value > 0 ? (value * 100).toFixed(1) + '%' : value)
                                : value}
                        </div>
                    </div>
                ))}
            </div>

            {report.issues.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-red-400 mb-2">发现的问题</h3>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {report.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                        ))}
                    </ul>
                </div>
            )}

            {report.recommendations.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-emerald-400 mb-2">改进建议</h3>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {report.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
