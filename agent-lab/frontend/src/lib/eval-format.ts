import type { EvalRunnerSummary, EvalRunRecord } from '@/types/eval';

export function formatDateTime(value?: string): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function formatLatency(ms?: number): string {
    if (ms === undefined || Number.isNaN(ms)) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function formatScoreValue(value: number | boolean | string): string {
    if (typeof value === 'number') {
        if (value > 0 && value <= 1) {
            return `${(value * 100).toFixed(2)}%`;
        }
        return Number.isInteger(value) ? `${value}` : value.toFixed(4);
    }

    return `${value}`;
}

export function getRunnerLabel(
    run: EvalRunRecord,
    runnerMap: Record<string, EvalRunnerSummary>
): string {
    const runnerId = run.provenance.runnerId;
    const meta = runnerMap[runnerId];

    if (!meta) return runnerId;
    return `${meta.type} · ${meta.id}`;
}
