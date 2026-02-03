export interface Agent {
    id: string;
    name: string;
    type: 'intent' | 'dialogue' | 'memory';
    description: string;
    config: {
        intents?: string[];
        examples?: Record<string, string[]>;
        maxHistoryLength?: number;
        maxMemorySize?: number;
        temperature?: number;
        maxTokens?: number;
    };
    systemPrompt: string;
    isBuiltin: boolean;
    createdAt: string;
    updatedAt: string;
}


export interface ApiConfig {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    baseUrl?: string;
    apiKeyMasked?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TestCase {
    input: unknown;
    expected?: unknown;
}

export interface Task {
    id?: string;
    name: string;
    description: string;
    type: 'intent' | 'dialogue' | 'memory';
    testCases: TestCase[];
}

export interface TestResult {
    id: string;
    testRunId: string;
    input: unknown;
    output: unknown;
    expected?: unknown;
    latency: number;
    tokenCount?: number;
    metrics: Record<string, unknown>;
    isCorrect?: boolean;
    createdAt: string;
}

export interface TestRun {
    id: string;
    agentId: string;
    taskId: string;
    datasetId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    agent: Agent;
    task: Task;
    dataset?: unknown;
    results: TestResult[];
}

export interface IntentMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    avgConfidence: number;
    latency: number;
}

export interface DialogueMetrics {
    coherenceScore: number;
    topicDriftCount: number;
    contextRetention: number;
    taskCompletionRate: number;
    avgTurnsToComplete: number;
    repeatRate: number;
    latencyPerTurn: number;
}

export interface MemoryMetrics {
    recallAccuracy: number;
    storageEfficiency: number;
    retrievalRelevance: number;
    updateLatency: number;
    memorySize: number;
    avgRetrievalTime: number;
}

export interface EvaluationReport {
    testRunId: string;
    summary: string;
    metrics: IntentMetrics | DialogueMetrics | MemoryMetrics;
    issues: string[];
    recommendations: string[];
    createdAt: string;
}
