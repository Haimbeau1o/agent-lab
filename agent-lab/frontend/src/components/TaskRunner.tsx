import { useState, useEffect } from 'react';
/* eslint-disable react-hooks/set-state-in-effect */
import { Agent, Task, ApiConfig } from '../types/api';
import { apiClient } from '../lib/api-client';
import { MOCK_AGENTS, MOCK_TASKS } from '../lib/mock-data';
import { cn } from '../lib/utils';

interface TaskRunnerProps {
    onRun: (agentId: string, taskId: string, apiConfigId: string) => void;
    isRunning: boolean;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function TaskRunner({ onRun, isRunning }: TaskRunnerProps) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);

    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [selectedTask, setSelectedTask] = useState<string>('');
    const [selectedConfig, setSelectedConfig] = useState<string>('');

    useEffect(() => {
        if (USE_MOCK) {
            setAgents(MOCK_AGENTS);
            setTasks(MOCK_TASKS);
            setApiConfigs([{ id: 'mock-config', name: 'Mock Config' }]);
            if (MOCK_AGENTS.length > 0) setSelectedAgent(MOCK_AGENTS[0].id);
            if (MOCK_TASKS.length > 0) setSelectedTask(MOCK_TASKS[0].id!);
            setSelectedConfig('mock-config');
        } else {
            Promise.all([
                apiClient.getAgents(),
                apiClient.getTasks(),
                apiClient.getApiConfigs()
            ]).then(([agentsData, tasksData, configsData]) => {
                setAgents(agentsData.data || []);
                setTasks(tasksData.data || []);
                setApiConfigs(configsData.data || []);

                if (agentsData.data?.length) setSelectedAgent(agentsData.data[0].id);
                if (tasksData.data?.length) setSelectedTask(tasksData.data[0].id);
                if (configsData.data?.length) setSelectedConfig(configsData.data[0].id);
            }).catch(console.error);
        }
    }, []);

    const handleRun = () => {
        if (selectedAgent && selectedTask && selectedConfig) {
            onRun(selectedAgent, selectedTask, selectedConfig);
        }
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">运行测试</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">选择 Agent</label>
                    <select
                        className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        disabled={isRunning}
                    >
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name} ({agent.type})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">选择任务</label>
                    <select
                        className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={selectedTask}
                        onChange={(e) => setSelectedTask(e.target.value)}
                        disabled={isRunning}
                    >
                        {tasks.map(task => (
                            <option key={task.id} value={task.id}>{task.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">API 配置</label>
                    <select
                        className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={selectedConfig}
                        onChange={(e) => setSelectedConfig(e.target.value)}
                        disabled={isRunning}
                    >
                        {apiConfigs.map(config => (
                            <option key={config.id} value={config.id}>{config.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                onClick={handleRun}
                disabled={isRunning || !selectedAgent || !selectedTask || !selectedConfig}
                className={cn(
                    "w-full py-2 px-4 rounded-md text-white font-medium transition-all shadow-lg shadow-indigo-500/20",
                    isRunning
                        ? "bg-zinc-700 cursor-not-allowed text-zinc-400"
                        : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/40"
                )}
            >
                {isRunning ? '测试运行中...' : '开始测试'}
            </button>
        </div>
    );
}
