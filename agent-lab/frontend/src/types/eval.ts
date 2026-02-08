export type EvalRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EvalTraceEvent {
    timestamp: string;
    level: 'info' | 'debug' | 'warn' | 'error';
    step?: string;
    event: string;
    data?: unknown;
}

export interface EvalStepSummary {
    stepId: string;
    stepName: string;
    status: 'completed' | 'failed' | 'skipped';
    latency: number;
    output?: unknown;
    error?: string;
}

export interface EvalRunProvenance {
    runnerId: string;
    runnerVersion: string;
    config: Record<string, unknown>;
    configSnapshot?: Record<string, unknown>;
    fingerprint?: string;
    [key: string]: unknown;
}

export interface EvalRunRecord {
    id: string;
    taskId: string;
    taskType: 'atomic' | 'scenario';
    status: EvalRunStatus;
    output?: unknown;
    error?: {
        message: string;
        step?: string;
        stack?: string;
    };
    metrics: {
        latency: number;
        tokens?: number;
        cost?: number;
    };
    trace: EvalTraceEvent[];
    steps?: EvalStepSummary[];
    startedAt: string;
    completedAt?: string;
    provenance: EvalRunProvenance;
}

export interface EvalScoreRecord {
    id: string;
    runId: string;
    metric: string;
    value: number | boolean | string;
    target: 'final' | 'global' | `step:${string}`;
    evidence?: {
        explanation?: string;
        snippets?: string[];
        alignment?: Record<string, unknown>;
    };
    evaluatorId: string;
    createdAt: string;
}

export interface EvalResult {
    run: EvalRunRecord;
    scores: EvalScoreRecord[];
}

export interface EvalComparisonItem {
    metric: string;
    value1: number | boolean | string;
    value2: number | boolean | string;
    diff?: number;
    improved?: boolean;
}

export interface EvalComparison {
    run1: EvalResult;
    run2: EvalResult;
    comparison: EvalComparisonItem[];
}

export interface EvalRunnerSummary {
    id: string;
    type: string;
    version: string;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    error?: string | { message?: string };
    meta?: {
        total?: number;
        limit?: number;
        offset?: number;
    };
}
