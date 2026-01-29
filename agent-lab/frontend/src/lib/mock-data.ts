import { Agent, Task, TestRun, EvaluationReport } from '../types/api';

export const MOCK_AGENTS: Agent[] = [
    {
        id: 'agent-1',
        name: '客服助手',
        type: 'intent',
        description: '处理常见客户咨询意图',
        config: {
            intents: ['refund', 'order_status', 'product_info'],
            temperature: 0.7
        },
        systemPrompt: '你是一个乐于助人的客服助手...',
        isBuiltin: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
    },
    {
        id: 'agent-2',
        name: '订票助手',
        type: 'dialogue',
        description: '帮助用户预订机票和酒店',
        config: {
            maxHistoryLength: 10
        },
        systemPrompt: '你是一个专业的订票助手...',
        isBuiltin: false,
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
    }
];

export const MOCK_TASKS: Task[] = [
    {
        id: 'task-1',
        name: '基础意图测试',
        description: '测试基本的退款和查询意图',
        type: 'intent',
        testCases: [
            { input: '我要退款', expected: { intent: 'refund' } },
            { input: '我的快递到哪了', expected: { intent: 'order_status' } }
        ]
    }
];

export const MOCK_TEST_RUN: TestRun = {
    id: 'run-1',
    agentId: 'agent-1',
    taskId: 'task-1',
    status: 'completed',
    startedAt: '2023-10-27T10:00:00Z',
    completedAt: '2023-10-27T10:00:05Z',
    agent: MOCK_AGENTS[0],
    task: MOCK_TASKS[0],
    results: [
        {
            id: 'res-1',
            testRunId: 'run-1',
            input: '我要退款',
            output: { intent: 'refund', confidence: 0.95 },
            expected: { intent: 'refund' },
            latency: 120,
            metrics: { confidence: 0.95 },
            isCorrect: true,
            createdAt: '2023-10-27T10:00:01Z'
        },
        {
            id: 'res-2',
            testRunId: 'run-1',
            input: '我的快递到哪了',
            output: { intent: 'order_status', confidence: 0.88 },
            expected: { intent: 'order_status' },
            latency: 150,
            metrics: { confidence: 0.88 },
            isCorrect: true,
            createdAt: '2023-10-27T10:00:02Z'
        }
    ]
};

export const MOCK_REPORT: EvaluationReport = {
    testRunId: 'run-1',
    summary: '该 Agent 在意图识别方面表现优秀，准确率达到 100%。',
    metrics: {
        accuracy: 1.0,
        precision: 1.0,
        recall: 1.0,
        f1Score: 1.0,
        avgConfidence: 0.915,
        latency: 135
    },
    issues: [],
    recommendations: ['可以增加更多边缘案例进行测试。'],
    createdAt: '2023-10-27T10:00:06Z'
};
