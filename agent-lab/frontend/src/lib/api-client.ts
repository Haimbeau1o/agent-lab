const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function handleResponse(response: Response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message =
            (typeof error.error === "string" && error.error)
            || error.error?.message
            || error.message
            || "请求失败";
        throw new Error(message);
    }

    const payload = await response.json();

    if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
        const message =
            (typeof payload.error === "string" && payload.error)
            || payload.error?.message
            || payload.message
            || "请求失败";
        throw new Error(message);
    }

    return payload;
}

export const apiClient = {
    // Agents
    getAgents: (type?: string) => {
        const url = new URL(`${API_BASE}/agents`);
        if (type && type !== "all") url.searchParams.set("type", type);
        return fetch(url).then(handleResponse);
    },
    getAgent: (id: string) => fetch(`${API_BASE}/agents/${id}`).then(handleResponse),

    // Tasks
    getTasks: () => fetch(`${API_BASE}/tasks`).then(handleResponse),
    createTask: (data: unknown) => fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // Test Runs
    startTestRun: (params: { agentId: string; taskId: string; apiConfigId: string; datasetId?: string }) =>
        fetch(`${API_BASE}/test-runs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        }).then(handleResponse),

    getTestRun: (id: string) => fetch(`${API_BASE}/test-runs/${id}`).then(handleResponse),
    getReport: (id: string) => fetch(`${API_BASE}/test-runs/${id}/report`).then(handleResponse),

    // Eval Runs
    getEvalRuns: (params?: {
        taskId?: string;
        taskType?: "atomic" | "scenario";
        status?: "pending" | "running" | "completed" | "failed";
        limit?: number;
        offset?: number;
    }) => {
        const url = new URL(`${API_BASE}/eval/runs`);
        if (!params) return fetch(url).then(handleResponse);

        if (params.taskId) url.searchParams.set("taskId", params.taskId);
        if (params.taskType) url.searchParams.set("taskType", params.taskType);
        if (params.status) url.searchParams.set("status", params.status);
        if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
        if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));

        return fetch(url).then(handleResponse);
    },
    getEvalRun: (id: string) => fetch(`${API_BASE}/eval/runs/${id}`).then(handleResponse),
    getEvalRunScores: (id: string) => fetch(`${API_BASE}/eval/runs/${id}/scores`).then(handleResponse),
    getEvalRunResult: (id: string) => fetch(`${API_BASE}/eval/runs/${id}/result`).then(handleResponse),
    compareEvalRuns: (runId1: string, runId2: string) =>
        fetch(`${API_BASE}/eval/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId1, runId2 }),
        }).then(handleResponse),
    getEvalRunners: () => fetch(`${API_BASE}/eval/runners`).then(handleResponse),

    // Settings
    getApiConfigs: () => fetch(`${API_BASE}/settings/api-config`).then(handleResponse),
    createApiConfig: (data: unknown) => fetch(`${API_BASE}/settings/api-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(handleResponse),
    testConnection: (id: string) => fetch(`${API_BASE}/settings/api-config/${id}/test`, {
        method: "POST",
    }).then(handleResponse),
};
