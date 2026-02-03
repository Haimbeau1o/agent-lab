const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function handleResponse(response: Response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({} as Record<string, unknown>));
        throw new Error(error.error?.message || error.message || "请求失败");
    }
    return response.json();
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
