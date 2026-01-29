/**
 * 数据流传递场景示例
 *
 * 这个示例展示了复杂的数据传递机制：
 * 1. 从场景初始输入传递数据到步骤
 * 2. 在步骤之间传递数据
 * 3. 多个数据源的组合使用
 */

import type { ScenarioTask } from '../../src/core/contracts/index.js'

export const dataFlowScenario: ScenarioTask = {
  id: 'data-flow-demo',
  name: '数据流传递演示',
  description: '展示场景中复杂的数据传递和转换机制',

  steps: [
    {
      id: 'user-analysis',
      name: '用户分析',
      type: 'analysis',
      input: {
        // 这些将被 input_map 覆盖
      },
      metadata: {
        description: '分析用户的基本信息和偏好'
      }
    },
    {
      id: 'content-recommendation',
      name: '内容推荐',
      type: 'recommendation',
      input: {
        // 这些将被 input_map 覆盖
      },
      metadata: {
        description: '基于用户分析结果推荐相关内容'
      }
    },
    {
      id: 'response-personalization',
      name: '响应个性化',
      type: 'personalization',
      input: {
        template: 'default_response_template'
      },
      metadata: {
        description: '个性化最终响应内容'
      }
    }
  ],

  // 复杂的数据传递映射
  input_map: {
    // 第一步：从场景输入获取数据
    'user-analysis': [
      { from: 'input:userId', to: 'user_id' },
      { from: 'input:userProfile', to: 'profile' },
      { from: 'input:context', to: 'interaction_context' }
    ],

    // 第二步：从第一步的输出获取数据
    'content-recommendation': [
      { from: 'step:user-analysis:user_preferences', to: 'preferences' },
      { from: 'step:user-analysis:user_category', to: 'category' },
      { from: 'input:contentType', to: 'content_type' }  // 同时从场景输入获取
    ],

    // 第三步：组合多个数据源
    'response-personalization': [
      { from: 'step:user-analysis:user_name', to: 'user_name' },
      { from: 'step:user-analysis:user_tone_preference', to: 'tone' },
      { from: 'step:content-recommendation:recommended_items', to: 'recommendations' },
      { from: 'step:content-recommendation:confidence_score', to: 'confidence' },
      { from: 'input:language', to: 'target_language' }
    ]
  },

  metadata: {
    category: 'data-flow',
    difficulty: 'intermediate',
    description: '演示如何在多步骤场景中进行复杂的数据传递和转换',

    // 场景的初始输入数据
    scenarioInput: {
      userId: 'user_12345',
      userProfile: {
        age: 28,
        interests: ['technology', 'music', 'travel'],
        subscription_tier: 'premium'
      },
      context: 'morning_greeting',
      contentType: 'news',
      language: 'zh-CN'
    }
  }
}

// 对应的配置示例
export const dataFlowConfig = {
  'user-analysis': {
    runnerId: 'user-analyzer-v2',
    temperature: 0.2,
    max_tokens: 300,
    // 分析类任务需要较低的随机性
    analysis_depth: 'detailed'
  },
  'content-recommendation': {
    runnerId: 'content-recommender-v1',
    temperature: 0.3,
    max_tokens: 500,
    // 推荐系统配置
    recommendation_count: 5,
    diversity_factor: 0.7
  },
  'response-personalization': {
    runnerId: 'response-personalizer-v1',
    temperature: 0.6,
    max_tokens: 400,
    // 个性化响应需要一定的创造性
    personalization_level: 'high'
  }
}

// 预期的数据流示例
export const expectedDataFlow = {
  step1_input: {
    user_id: 'user_12345',
    profile: {
      age: 28,
      interests: ['technology', 'music', 'travel'],
      subscription_tier: 'premium'
    },
    interaction_context: 'morning_greeting'
  },

  step1_output: {
    user_preferences: ['tech_news', 'music_reviews', 'travel_guides'],
    user_category: 'tech_enthusiast',
    user_name: 'Alex',
    user_tone_preference: 'casual_friendly'
  },

  step2_input: {
    preferences: ['tech_news', 'music_reviews', 'travel_guides'],
    category: 'tech_enthusiast',
    content_type: 'news'
  },

  step2_output: {
    recommended_items: [
      { title: 'Latest AI Developments', score: 0.95 },
      { title: 'New Music Tech Trends', score: 0.87 }
    ],
    confidence_score: 0.91
  },

  step3_input: {
    user_name: 'Alex',
    tone: 'casual_friendly',
    recommendations: [
      { title: 'Latest AI Developments', score: 0.95 },
      { title: 'New Music Tech Trends', score: 0.87 }
    ],
    confidence: 0.91,
    target_language: 'zh-CN',
    template: 'default_response_template'
  }
}