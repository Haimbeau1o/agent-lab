import { TestRun, TestResult } from '../types/api';
import { cn } from '../lib/utils';

interface TraceViewerProps {
    testRun: TestRun | null;
}

export function TraceViewer({ testRun }: TraceViewerProps) {
    if (!testRun) return null;

    return (
        <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">执行详情</h2>

            <div className="space-y-4">
                {testRun.results.map((result, index) => (
                    <ResultCard key={result.id} result={result} index={index} />
                ))}

                {testRun.results.length === 0 && testRun.status === 'running' && (
                    <div className="text-center py-8 text-zinc-500 animate-pulse">
                        正在执行测试用例...
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultCard({ result, index }: { result: TestResult; index: number }) {
    const isCorrect = result.isCorrect;

    return (
        <div className={cn(
            "border rounded-lg p-4 transition-all",
            isCorrect === true ? "border-emerald-500/20 bg-emerald-500/5" :
                isCorrect === false ? "border-red-500/20 bg-red-500/5" :
                    "border-zinc-800 bg-zinc-900/50"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-zinc-300">Case #{index + 1}</span>
                <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    isCorrect === true ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        isCorrect === false ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                )}>
                    {isCorrect === true ? 'PASS' : isCorrect === false ? 'FAIL' : 'PENDING'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-zinc-500 mb-1">Input</div>
                    <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-x-auto text-zinc-300 font-mono text-xs">
                        {typeof result.input === 'string' ? result.input : JSON.stringify(result.input, null, 2)}
                    </pre>
                </div>

                <div>
                    <div className="text-zinc-500 mb-1">Output</div>
                    <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-x-auto text-zinc-300 font-mono text-xs">
                        {JSON.stringify(result.output, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">⏱️ {result.latency}ms</span>
                {result.metrics?.confidence && (
                    <span className="flex items-center gap-1">🎯 {(result.metrics.confidence * 100).toFixed(1)}%</span>
                )}
            </div>
        </div>
    );
}
