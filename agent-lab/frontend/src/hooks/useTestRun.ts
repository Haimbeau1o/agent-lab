import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { TestRun, EvaluationReport } from '../types/api';
import { MOCK_TEST_RUN, MOCK_REPORT } from '../lib/mock-data';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return '测试执行失败';
}

export function useTestRun() {
    const [testRun, setTestRun] = useState<TestRun | null>(null);
    const [report, setReport] = useState<EvaluationReport | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);

    const startTest = useCallback(async (agentId: string, taskId: string, apiConfigId: string) => {
        setStatus('running');
        setError(null);
        setTestRun(null);
        setReport(null);

        try {
            if (USE_MOCK) {
                // 模拟延迟
                await new Promise(resolve => setTimeout(resolve, 1000));
                setTestRun({ ...MOCK_TEST_RUN, status: 'running' });

                await new Promise(resolve => setTimeout(resolve, 2000));
                setTestRun(MOCK_TEST_RUN);
                setStatus('completed');

                await new Promise(resolve => setTimeout(resolve, 500));
                setReport(MOCK_REPORT);
                return;
            }

            // 1. 启动测试
            const { data: startData } = await apiClient.startTestRun({ agentId, taskId, apiConfigId });
            const testRunId = startData.id;

            // 2. 轮询状态
            let currentRun: TestRun = startData;
            while (currentRun.status === 'running' || currentRun.status === 'pending') {
                setTestRun(currentRun);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const { data: statusData } = await apiClient.getTestRun(testRunId);
                currentRun = statusData;
            }

            setTestRun(currentRun);
            setStatus(currentRun.status);

            // 3. 获取报告
            if (currentRun.status === 'completed') {
                const { data: reportData } = await apiClient.getReport(testRunId);
                setReport(reportData);
            }
        } catch (error: unknown) {
            setError(getErrorMessage(error));
            setStatus('failed');
        }
    }, []);

    return {
        testRun,
        report,
        status,
        error,
        startTest
    };
}
