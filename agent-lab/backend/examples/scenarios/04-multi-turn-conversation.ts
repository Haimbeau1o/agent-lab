/**
 * 多轮对话场景示例
 *
 * 这个示例展示了复杂的多轮对话流程：
 * 1. 上下文理解 - 理解对话历史和当前上下文
 * 2. 意图识别 - 识别用户在当前轮次的意图
 * 3. 实体提取 - 从用户输入中提取关键实体
 * 4. 对话状态管理 - 更新对话状态
 * 5. 响应生成 - 生成上下文相关的回复
 */

import type { ScenarioTask } from '../../src/core/contracts/index.js'

export const multiTurnConversationScenario: ScenarioTask = {
  id: 'multi-turn-conversation',
  name: '多轮对话管理',
  description: '演示复杂的多轮对话流程，包括上下文理解、状态管理和个性化响应',

  steps: [
    {
      id: 'context-understanding',
      name: '上下文理解',
      type: 'context',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '分析对话历史，理解当前对话的上下文和背景',
        importance: 'high'
      }
    },
    {
      id: 'intent-recognition',
      name: '意图识别',
      type: 'intent',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '基于上下文识别用户的真实意图',
        confidence_threshold: 0.7
      }
    },
    {
      id: 'entity-extraction',
      name: '实体提取',
      type: 'entity',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '从用户输入中提取关键实体和参数',
        entity_types: ['person', 'location', 'time', 'product', 'action']
      }
    },
    {
      id: 'dialogue-state-update',
      name: '对话状态更新',
      type: 'state',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '更新对话状态，跟踪用户需求和对话进展',
        state_persistence: true
      }
    },
    {
      id: 'response-generation',
      name: '响应生成',
      type: 'dialogue',
      input: {
        response_style: 'conversational',
        max_length: 200
      },
      metadata: {
        description: '基于完整上下文生成自然的对话响应',
        personalization: true
      }
    }
  ],

  // 复杂的数据流，展示多步骤间的依赖关系
  input_map: {
    'context-understanding': [
      { from: 'input:conversationHistory', to: 'history' },
      { from: 'input:currentMessage', to: 'current_input' },
      { from: 'input:userProfile', to: 'user_context' }
    ],

    'intent-recognition': [
      { from: 'step:context-understanding:context_summary', to: 'context' },
      { from: 'input:currentMessage', to: 'user_message' },
      { from: 'step:context-understanding:conversation_stage', to: 'dialogue_stage' }
    ],

    'entity-extraction': [
      { from: 'input:currentMessage', to: 'text' },
      { from: 'step:intent-recognition:intent', to: 'expected_intent' },
      { from: 'step:context-understanding:domain', to: 'domain_context' }
    ],

    'dialogue-state-update': [
      { from: 'input:currentDialogueState', to: 'previous_state' },
      { from: 'step:intent-recognition:intent', to: 'current_intent' },
      { from: 'step:intent-recognition:confidence', to: 'intent_confidence' },
      { from: 'step:entity-extraction:entities', to: 'extracted_entities' },
      { from: 'step:context-understanding:context_summary', to: 'context' }
    ],

    'response-generation': [
      { from: 'step:dialogue-state-update:updated_state', to: 'dialogue_state' },
      { from: 'step:intent-recognition:intent', to: 'user_intent' },
      { from: 'step:entity-extraction:entities', to: 'entities' },
      { from: 'step:context-understanding:user_emotion', to: 'emotional_context' },
      { from: 'input:userProfile', to: 'user_profile' }
    ]
  },

  metadata: {
    category: 'conversation',
    difficulty: 'advanced',
    description: '完整的多轮对话处理流程，适合构建智能对话系统',

    // 示例对话场景：用户预订餐厅
    scenarioInput: {
      conversationHistory: [
        {
          role: 'user',
          message: '我想预订一个餐厅',
          timestamp: '2024-01-29T10:00:00Z'
        },
        {
          role: 'assistant',
          message: '好的，我来帮您预订餐厅。请问您希望什么时候用餐？',
          timestamp: '2024-01-29T10:00:05Z'
        },
        {
          role: 'user',
          message: '明天晚上7点',
          timestamp: '2024-01-29T10:00:15Z'
        },
        {
          role: 'assistant',
          message: '明天晚上7点，好的。请问有几位用餐？',
          timestamp: '2024-01-29T10:00:20Z'
        }
      ],
      currentMessage: '4个人，我们想要一个安静的位置',
      userProfile: {
        name: '张先生',
        preferences: ['中餐', '安静环境', '靠窗座位'],
        vip_level: 'gold',
        previous_bookings: 15
      },
      currentDialogueState: {
        intent: 'restaurant_booking',
        collected_info: {
          date: '2024-01-30',
          time: '19:00',
          party_size: null,
          preferences: []
        },
        missing_info: ['party_size', 'cuisine_preference'],
        stage: 'collecting_details'
      }
    },

    // 预期的处理流程
    expected_flow: {
      context_understanding: '识别这是餐厅预订的后续对话',
      intent_recognition: '确认用户提供了人数和座位偏好',
      entity_extraction: '提取"4个人"和"安静的位置"',
      state_update: '更新对话状态，标记人数已收集',
      response_generation: '确认信息并询问下一个必要信息'
    }
  }
}

// 对应的配置示例
export const multiTurnConversationConfig = {
  'context-understanding': {
    runnerId: 'context-analyzer-v2',
    temperature: 0.2,
    max_tokens: 400,
    // 上下文理解需要稳定性
    context_window: 10,  // 考虑最近10轮对话
    summarization_level: 'detailed'
  },

  'intent-recognition': {
    runnerId: 'intent-classifier-v3',
    temperature: 0.1,
    max_tokens: 200,
    // 意图识别需要高精度
    confidence_threshold: 0.7,
    context_aware: true
  },

  'entity-extraction': {
    runnerId: 'entity-extractor-v2',
    temperature: 0.0,
    max_tokens: 300,
    // 实体提取需要确定性
    entity_types: ['number', 'time', 'location', 'preference'],
    fuzzy_matching: true
  },

  'dialogue-state-update': {
    runnerId: 'state-manager-v1',
    temperature: 0.1,
    max_tokens: 500,
    // 状态管理需要逻辑一致性
    state_validation: true,
    conflict_resolution: 'latest_wins'
  },

  'response-generation': {
    runnerId: 'dialogue-generator-v2',
    temperature: 0.7,
    max_tokens: 300,
    // 响应生成需要自然性
    personality: 'helpful_professional',
    response_length: 'medium'
  }
}

// 预期的执行结果示例
export const expectedMultiTurnResult = {
  context_understanding: {
    context_summary: '用户正在预订餐厅，已提供日期和时间，现在提供人数和座位偏好',
    conversation_stage: 'information_collection',
    domain: 'restaurant_booking',
    user_emotion: 'neutral_cooperative'
  },

  intent_recognition: {
    intent: 'provide_booking_details',
    confidence: 0.92,
    sub_intents: ['specify_party_size', 'express_seating_preference']
  },

  entity_extraction: {
    entities: [
      { type: 'number', value: 4, field: 'party_size' },
      { type: 'preference', value: '安静的位置', field: 'seating_preference' }
    ]
  },

  dialogue_state_update: {
    updated_state: {
      intent: 'restaurant_booking',
      collected_info: {
        date: '2024-01-30',
        time: '19:00',
        party_size: 4,
        preferences: ['安静的位置']
      },
      missing_info: ['cuisine_preference', 'special_requirements'],
      stage: 'collecting_preferences',
      completion_percentage: 0.7
    }
  },

  response_generation: {
    response: '好的，张先生，为您预订明天晚上7点的4人桌，我会为您安排安静的位置。请问您对菜系有什么偏好吗？比如中餐、西餐或者其他特色菜？',
    response_type: 'clarification_question',
    next_expected_intent: 'cuisine_preference'
  }
}