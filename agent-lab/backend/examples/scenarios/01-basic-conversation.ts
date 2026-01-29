/**
 * 基础对话场景示例
 *
 * 这个示例展示了一个简单的两步对话流程：
 * 1. 意图识别 - 识别用户输入的意图
 * 2. 响应生成 - 基于识别的意图生成合适的回复
 */

import type { ScenarioTask } from '../../src/core/contracts/index.js'

export const basicConversationScenario: ScenarioTask = {
  id: 'basic-conversation',
  name: '基础对话流程',
  description: '演示意图识别和响应生成的基本对话流程',

  steps: [
    {
      id: 'intent-recognition',
      name: '意图识别',
      type: 'intent',
      input: {
        text: 'Hello, how are you?'
      },
      metadata: {
        tags: ['intent', 'classification'],
        priority: 1
      },
      extensions: {
        description: '分析用户输入，识别对话意图'
      }
    },
    {
      id: 'response-generation',
      name: '响应生成',
      type: 'dialogue',
      input: {
        text: 'Hello, how are you?'
      },
      metadata: {
        tags: ['dialogue', 'generation'],
        priority: 2
      },
      extensions: {
        description: '基于识别的意图生成合适的回复'
      }
    }
  ],

  // 数据传递映射：将第一步的输出传递给第二步
  input_map: {
    'response-generation': [
      { from: 'step:intent-recognition:intent', to: 'detected_intent' },
      { from: 'step:intent-recognition:confidence', to: 'confidence_score' }
    ]
  },

  metadata: {
    category: 'conversation',
    difficulty: 'basic',
    description: '这是最基础的对话场景，适合初学者了解 ScenarioTask 的工作原理'
  }
}

// 对应的配置示例
export const basicConversationConfig = {
  'intent-recognition': {
    runnerId: 'intent-classifier-v1',
    temperature: 0.1,  // 低温度确保稳定的意图识别
    max_tokens: 100
  },
  'response-generation': {
    runnerId: 'dialogue-generator-v1',
    temperature: 0.7,  // 较高温度生成更自然的回复
    max_tokens: 200
  }
}