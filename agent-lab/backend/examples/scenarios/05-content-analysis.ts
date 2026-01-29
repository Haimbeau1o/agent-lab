/**
 * 内容分析处理场景示例
 *
 * 这个示例展示了完整的内容分析和处理流程：
 * 1. 内容预处理 - 清理和标准化输入内容
 * 2. 语言检测 - 识别内容的语言
 * 3. 情感分析 - 分析内容的情感倾向
 * 4. 主题分类 - 对内容进行主题分类
 * 5. 关键词提取 - 提取关键词和短语
 * 6. 内容摘要 - 生成内容摘要
 * 7. 结果整合 - 整合所有分析结果
 */

import type { ScenarioTask } from '../../src/core/contracts/index.js'

export const contentAnalysisScenario: ScenarioTask = {
  id: 'content-analysis-pipeline',
  name: '内容分析处理流程',
  description: '完整的内容分析流程，包括预处理、多维度分析和结果整合',

  steps: [
    {
      id: 'content-preprocessing',
      name: '内容预处理',
      type: 'preprocessing',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '清理和标准化输入内容，去除噪声和格式化文本',
        operations: ['clean_html', 'normalize_whitespace', 'remove_special_chars']
      }
    },
    {
      id: 'language-detection',
      name: '语言检测',
      type: 'language',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '检测内容的主要语言和可能的多语言混合',
        confidence_threshold: 0.8
      }
    },
    {
      id: 'sentiment-analysis',
      name: '情感分析',
      type: 'sentiment',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '分析内容的情感倾向和强度',
        dimensions: ['polarity', 'subjectivity', 'emotion']
      }
    },
    {
      id: 'topic-classification',
      name: '主题分类',
      type: 'classification',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '对内容进行多级主题分类',
        classification_levels: ['primary', 'secondary', 'tertiary']
      }
    },
    {
      id: 'keyword-extraction',
      name: '关键词提取',
      type: 'extraction',
      input: {
        // 将通过 input_map 填充
      },
      metadata: {
        description: '提取关键词、短语和命名实体',
        extraction_types: ['keywords', 'phrases', 'entities']
      }
    },
    {
      id: 'content-summarization',
      name: '内容摘要',
      type: 'summarization',
      input: {
        summary_length: 'medium',
        summary_style: 'extractive'
      },
      metadata: {
        description: '生成内容的结构化摘要',
        summary_types: ['abstract', 'key_points', 'conclusion']
      }
    },
    {
      id: 'result-integration',
      name: '结果整合',
      type: 'integration',
      input: {
        output_format: 'structured'
      },
      metadata: {
        description: '整合所有分析结果，生成综合报告',
        integration_strategy: 'weighted_combination'
      }
    }
  ],

  // 展示复杂的数据流和依赖关系
  input_map: {
    'content-preprocessing': [
      { from: 'input:rawContent', to: 'raw_text' },
      { from: 'input:contentType', to: 'content_type' },
      { from: 'input:processingOptions', to: 'options' }
    ],

    'language-detection': [
      { from: 'step:content-preprocessing:cleaned_text', to: 'text' },
      { from: 'step:content-preprocessing:detected_encoding', to: 'encoding' }
    ],

    'sentiment-analysis': [
      { from: 'step:content-preprocessing:cleaned_text', to: 'text' },
      { from: 'step:language-detection:primary_language', to: 'language' },
      { from: 'step:language-detection:confidence', to: 'language_confidence' }
    ],

    'topic-classification': [
      { from: 'step:content-preprocessing:cleaned_text', to: 'text' },
      { from: 'step:language-detection:primary_language', to: 'language' },
      { from: 'step:content-preprocessing:text_length', to: 'content_length' }
    ],

    'keyword-extraction': [
      { from: 'step:content-preprocessing:cleaned_text', to: 'text' },
      { from: 'step:language-detection:primary_language', to: 'language' },
      { from: 'step:topic-classification:primary_topic', to: 'domain_context' }
    ],

    'content-summarization': [
      { from: 'step:content-preprocessing:cleaned_text', to: 'source_text' },
      { from: 'step:language-detection:primary_language', to: 'language' },
      { from: 'step:topic-classification:topics', to: 'topic_context' },
      { from: 'step:keyword-extraction:keywords', to: 'key_terms' }
    ],

    'result-integration': [
      { from: 'step:content-preprocessing:metadata', to: 'preprocessing_info' },
      { from: 'step:language-detection:language_info', to: 'language_analysis' },
      { from: 'step:sentiment-analysis:sentiment_scores', to: 'sentiment_results' },
      { from: 'step:topic-classification:classification_results', to: 'topic_results' },
      { from: 'step:keyword-extraction:extraction_results', to: 'keyword_results' },
      { from: 'step:content-summarization:summary_results', to: 'summary_results' },
      { from: 'input:analysisGoals', to: 'analysis_objectives' }
    ]
  },

  metadata: {
    category: 'content-analysis',
    difficulty: 'advanced',
    description: '完整的内容分析流水线，适合构建内容理解和处理系统',

    // 示例分析内容：一篇技术博客文章
    scenarioInput: {
      rawContent: `
        <article>
          <h1>The Future of Artificial Intelligence in Healthcare</h1>
          <p>Artificial Intelligence (AI) is revolutionizing healthcare in unprecedented ways.
          From diagnostic imaging to drug discovery, AI technologies are enhancing medical
          practices and improving patient outcomes.</p>

          <p>Machine learning algorithms can now detect diseases like cancer with accuracy
          rates that often exceed human specialists. This breakthrough technology is not
          just improving diagnosis speed but also reducing healthcare costs significantly.</p>

          <p>However, the integration of AI in healthcare also raises important ethical
          questions about data privacy, algorithmic bias, and the human touch in medical care.
          As we move forward, it's crucial to balance technological advancement with
          ethical considerations.</p>

          <p>The future looks promising, with AI-powered personalized medicine on the horizon.
          We can expect to see more targeted treatments, predictive healthcare, and
          improved patient experiences in the coming years.</p>
        </article>
      `,
      contentType: 'html_article',
      processingOptions: {
        preserve_structure: true,
        extract_metadata: true,
        clean_html: true
      },
      analysisGoals: [
        'content_understanding',
        'sentiment_assessment',
        'topic_identification',
        'key_information_extraction'
      ]
    },

    // 预期的处理流程
    expected_pipeline: {
      preprocessing: '清理HTML标签，标准化文本格式',
      language_detection: '识别为英文内容',
      sentiment_analysis: '整体积极，带有谨慎的平衡观点',
      topic_classification: '人工智能、医疗健康、技术应用',
      keyword_extraction: 'AI, healthcare, machine learning, diagnosis',
      summarization: '生成结构化摘要和要点',
      integration: '综合所有分析结果'
    }
  }
}

// 对应的配置示例
export const contentAnalysisConfig = {
  'content-preprocessing': {
    runnerId: 'content-preprocessor-v2',
    temperature: 0.0,  // 预处理需要确定性
    max_tokens: 1000,
    html_cleaning: true,
    text_normalization: true
  },

  'language-detection': {
    runnerId: 'language-detector-v1',
    temperature: 0.0,
    max_tokens: 200,
    // 语言检测需要高精度
    multi_language_support: true,
    confidence_threshold: 0.8
  },

  'sentiment-analysis': {
    runnerId: 'sentiment-analyzer-v3',
    temperature: 0.1,
    max_tokens: 400,
    // 情感分析配置
    analysis_depth: 'detailed',
    emotion_categories: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral']
  },

  'topic-classification': {
    runnerId: 'topic-classifier-v2',
    temperature: 0.2,
    max_tokens: 500,
    // 主题分类配置
    classification_model: 'hierarchical',
    max_topics: 5,
    confidence_threshold: 0.6
  },

  'keyword-extraction': {
    runnerId: 'keyword-extractor-v2',
    temperature: 0.1,
    max_tokens: 600,
    // 关键词提取配置
    extraction_methods: ['tfidf', 'textrank', 'ner'],
    max_keywords: 20,
    phrase_length: [1, 3]
  },

  'content-summarization': {
    runnerId: 'content-summarizer-v1',
    temperature: 0.3,
    max_tokens: 800,
    // 摘要生成配置
    summary_ratio: 0.3,
    preserve_key_points: true,
    abstractive_mode: true
  },

  'result-integration': {
    runnerId: 'result-integrator-v1',
    temperature: 0.2,
    max_tokens: 1000,
    // 结果整合配置
    output_format: 'json_structured',
    confidence_weighting: true,
    cross_validation: true
  }
}

// 预期的分析结果示例
export const expectedAnalysisResults = {
  preprocessing: {
    cleaned_text: 'Artificial Intelligence (AI) is revolutionizing healthcare...',
    metadata: {
      original_length: 1247,
      cleaned_length: 1089,
      html_tags_removed: 8,
      encoding: 'utf-8'
    }
  },

  language_detection: {
    primary_language: 'en',
    confidence: 0.98,
    secondary_languages: [],
    language_info: {
      script: 'Latin',
      region: 'US'
    }
  },

  sentiment_analysis: {
    sentiment_scores: {
      polarity: 0.65,  // 积极
      subjectivity: 0.45,  // 中等主观性
      compound: 0.72
    },
    emotions: {
      optimism: 0.8,
      concern: 0.3,
      neutral: 0.4
    }
  },

  topic_classification: {
    primary_topic: 'artificial_intelligence',
    secondary_topics: ['healthcare', 'medical_technology'],
    classification_results: {
      'AI/ML': 0.92,
      'Healthcare': 0.88,
      'Technology': 0.75,
      'Ethics': 0.45
    }
  },

  keyword_extraction: {
    keywords: [
      { term: 'artificial intelligence', score: 0.95, type: 'phrase' },
      { term: 'healthcare', score: 0.89, type: 'keyword' },
      { term: 'machine learning', score: 0.82, type: 'phrase' },
      { term: 'diagnosis', score: 0.76, type: 'keyword' }
    ],
    entities: [
      { text: 'AI', type: 'TECHNOLOGY', confidence: 0.98 }
    ]
  },

  summarization: {
    abstract: 'AI is transforming healthcare through improved diagnostics and treatment, while raising ethical considerations.',
    key_points: [
      'AI improves diagnostic accuracy beyond human specialists',
      'Technology reduces healthcare costs significantly',
      'Ethical concerns about privacy and bias need addressing',
      'Future promises personalized medicine and predictive care'
    ]
  },

  integration: {
    overall_analysis: {
      content_type: 'informative_article',
      main_theme: 'AI in healthcare',
      tone: 'optimistic_but_balanced',
      complexity: 'medium',
      target_audience: 'general_tech_audience'
    },
    confidence_scores: {
      language_detection: 0.98,
      sentiment_analysis: 0.87,
      topic_classification: 0.91,
      keyword_extraction: 0.84,
      summarization: 0.89
    }
  }
}