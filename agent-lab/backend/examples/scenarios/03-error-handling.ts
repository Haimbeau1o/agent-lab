/**
 * 错误处理场景示例
 *
 * 这个示例展示了场景中的错误处理机制：
 * 1. 模拟可能失败的步骤
 * 2. 展示错误传播和处理
 * 3. 演示部分成功的场景
 */

import type { ScenarioTask } from '../../src/core/contracts/index.js'

export const errorHandlingScenario: ScenarioTask = {
  id: 'error-handling-demo',
  name: '错误处理演示',
  description: '展示场景执行中的错误处理和恢复机制',

  steps: [
    {
      id: 'validation-step',
      name: '输入验证',
      type: 'validation',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '验证输入数据的格式和完整性',
        critical: true  // 标记为关键步骤
      }
    },
    {
      id: 'risky-processing',
      name: '风险处理步骤',
      type: 'processing',
      input: {
        retry_count: 3,
        timeout: 5000
      },
      metadata: {
        description: '可能失败的处理步骤，用于演示错误处理',
        expected_failure_rate: 0.3
      }
    },
    {
      id: 'fallback-step',
      name: '备用处理',
      type: 'fallback',
      input: {
        fallback_strategy: 'simple'
      },
      metadata: {
        description: '当主要处理失败时的备用方案',
        always_execute: false
      }
    },
    {
      id: 'result-aggregation',
      name: '结果聚合',
      type: 'aggregation',
      input: {},
      metadata: {
        description: '聚合所有步骤的结果，即使某些步骤失败'
      }
    }
  ],

  input_map: {
    'validation-step': [
      { from: 'input:data', to: 'raw_data' },
      { from: 'input:schema', to: 'validation_schema' }
    ],
    'risky-processing': [
      { from: 'step:validation-step:validated_data', to: 'input_data' },
      { from: 'step:validation-step:data_type', to: 'processing_type' }
    ],
    'fallback-step': [
      { from: 'input:data', to: 'original_data' },
      { from: 'step:validation-step:validated_data', to: 'validated_data' }
    ],
    'result-aggregation': [
      { from: 'step:validation-step:status', to: 'validation_status' },
      { from: 'step:risky-processing:result', to: 'primary_result' },
      { from: 'step:risky-processing:error', to: 'primary_error' },
      { from: 'step:fallback-step:result', to: 'fallback_result' }
    ]
  },

  metadata: {
    category: 'error-handling',
    difficulty: 'advanced',
    description: '演示如何在多步骤场景中处理错误和实现容错机制',

    // 测试用的输入数据
    scenarioInput: {
      data: {
        user_id: 'test_user',
        content: 'This is test content',
        timestamp: '2024-01-29T10:00:00Z'
      },
      schema: {
        required_fields: ['user_id', 'content'],
        max_content_length: 1000
      }
    },

    // 错误处理策略
    error_handling: {
      continue_on_failure: true,
      max_retries: 2,
      fallback_enabled: true
    }
  }
}

// 对应的配置示例
export const errorHandlingConfig = {
  'validation-step': {
    runnerId: 'data-validator-v1',
    temperature: 0.0,  // 验证步骤需要确定性
    strict_mode: true,
    timeout: 3000
  },
  'risky-processing': {
    runnerId: 'risky-processor-v1',
    temperature: 0.5,
    max_tokens: 500,
    // 模拟不稳定的处理器
    failure_simulation: true,
    failure_rate: 0.3
  },
  'fallback-step': {
    runnerId: 'fallback-processor-v1',
    temperature: 0.2,
    max_tokens: 300,
    // 备用处理器应该更稳定
    conservative_mode: true
  },
  'result-aggregation': {
    runnerId: 'result-aggregator-v1',
    temperature: 0.1,
    max_tokens: 400,
    // 聚合器需要处理部分失败的情况
    partial_results_handling: true
  }
}

// 可能的执行结果示例
export const errorHandlingResults = {
  // 场景 1: 全部成功
  all_success: {
    status: 'completed',
    steps: [
      { id: 'validation-step', status: 'completed' },
      { id: 'risky-processing', status: 'completed' },
      { id: 'fallback-step', status: 'skipped' },  // 主处理成功时跳过
      { id: 'result-aggregation', status: 'completed' }
    ]
  },

  // 场景 2: 主处理失败，备用成功
  fallback_success: {
    status: 'completed',
    steps: [
      { id: 'validation-step', status: 'completed' },
      { id: 'risky-processing', status: 'failed' },
      { id: 'fallback-step', status: 'completed' },
      { id: 'result-aggregation', status: 'completed' }
    ]
  },

  // 场景 3: 验证失败，整个场景失败
  validation_failure: {
    status: 'failed',
    error: {
      step: 'validation-step',
      message: 'Input validation failed: missing required field user_id'
    },
    steps: [
      { id: 'validation-step', status: 'failed' },
      { id: 'risky-processing', status: 'not_executed' },
      { id: 'fallback-step', status: 'not_executed' },
      { id: 'result-aggregation', status: 'not_executed' }
    ]
  }
}