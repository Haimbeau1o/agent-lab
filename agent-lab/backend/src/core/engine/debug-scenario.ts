import { ScenarioExecutor } from './scenario-executor.js'
import { RunnerRegistry } from '../registry/runner-registry.js'
import type { ScenarioTask, AtomicTask, Runner } from '../contracts/index.js'

// 创建一个简单的 mock runner
const mockRunner: Runner = {
  id: 'test-runner',
  type: 'test',
  version: '1.0.0',
  execute: async (task: AtomicTask) => {
    console.log('Runner received input:', JSON.stringify(task.input, null, 2))

    return {
      id: `run-${task.id}`,
      taskId: task.id,
      taskType: 'atomic' as const,
      status: 'completed' as const,
      output: { result: 'success', receivedInput: task.input },
      metrics: {
        latency: 100,
        tokens: 50,
        cost: 0.001
      },
      trace: [],
      startedAt: new Date(),
      completedAt: new Date(),
      provenance: {
        runnerId: 'test-runner',
        runnerVersion: '1.0.0',
        config: {}
      }
    }
  }
}

async function testDataPassing() {
  const registry = new RunnerRegistry()
  registry.register(mockRunner)

  const executor = new ScenarioExecutor()

  const scenario: ScenarioTask = {
    id: 'test-scenario',
    name: 'Test Data Passing',
    description: 'Test',
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
        type: 'test',
        input: { original: 'data' },
        metadata: {}
      }
    ],
    input_map: {
      'step-1': [
        { from: 'input:userId', to: 'input.user_id' },
        { from: 'input:message', to: 'input.text' }
      ]
    },
    metadata: {
      scenarioInput: { userId: '123', message: 'Hello' }
    }
  }

  const config = {
    'step-1': { runnerId: 'test-runner' }
  }

  console.log('Scenario metadata:', JSON.stringify(scenario.metadata, null, 2))
  console.log('Input map:', JSON.stringify(scenario.input_map, null, 2))

  const result = await executor.execute(scenario, registry, config)

  console.log('Result status:', result.status)
  console.log('Result output:', JSON.stringify(result.output, null, 2))
}

testDataPassing().catch(console.error)
