import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create built-in Intent Recognition Agent
  const intentAgent = await prisma.agentTemplate.create({
    data: {
      name: '基础意图识别',
      type: 'intent',
      description: '识别用户输入的基本意图类别，支持客服场景常见意图',
      systemPrompt: 'You are an intent recognition system for customer service.',
      config: JSON.stringify({
        intents: ['greeting', 'question', 'complaint', 'refund', 'order_status', 'farewell'],
        examples: {
          greeting: ['你好', 'hello', '早上好'],
          question: ['怎么办', 'how to', '如何'],
          complaint: ['不满意', 'problem', '问题'],
          refund: ['退款', 'refund', '退货'],
          order_status: ['订单在哪', 'where is my order', '物流'],
          farewell: ['再见', 'goodbye', 'bye']
        },
        temperature: 0.3,
        maxTokens: 100
      }),
      isBuiltin: true
    }
  })

  console.log('✅ Created built-in Intent Recognition Agent')

  // Create built-in Dialogue Agent
  const dialogueAgent = await prisma.agentTemplate.create({
    data: {
      name: '多轮对话助手',
      type: 'dialogue',
      description: '管理多轮对话上下文，保持对话连贯性',
      systemPrompt: 'You are a helpful assistant that maintains context across multiple conversation turns.',
      config: JSON.stringify({
        maxHistoryLength: 10,
        contextWindowSize: 4096,
        temperature: 0.7,
        maxTokens: 150
      }),
      isBuiltin: true
    }
  })

  console.log('✅ Created built-in Dialogue Agent')

  // Create built-in Memory Agent
  const memoryAgent = await prisma.agentTemplate.create({
    data: {
      name: '长期记忆管理器',
      type: 'memory',
      description: '存储和检索重要信息，提供长期记忆能力',
      systemPrompt: 'You are a memory extraction and recall system.',
      config: JSON.stringify({
        storageType: 'json',
        maxMemorySize: 100,
        temperature: 0.5,
        maxTokens: 200
      }),
      isBuiltin: true
    }
  })

  console.log('✅ Created built-in Memory Agent')

  // Create sample Intent Recognition Task
  const intentTask = await prisma.task.create({
    data: {
      name: '客服意图识别测试',
      description: '测试客服场景下的意图识别准确性',
      type: 'intent',
      testCases: JSON.stringify([
        {
          input: '我要退款',
          expected: { intent: 'refund', confidence: 0.9 }
        },
        {
          input: '订单在哪里',
          expected: { intent: 'order_status', confidence: 0.85 }
        },
        {
          input: '你好，请问可以帮我吗？',
          expected: { intent: 'greeting', confidence: 0.9 }
        },
        {
          input: '产品有问题，不满意',
          expected: { intent: 'complaint', confidence: 0.8 }
        },
        {
          input: '怎么修改收货地址？',
          expected: { intent: 'question', confidence: 0.85 }
        }
      ])
    }
  })

  console.log('✅ Created sample Intent Recognition Task')

  // Create sample Dialogue Task
  const dialogueTask = await prisma.task.create({
    data: {
      name: '订票对话测试',
      description: '测试多轮对话中的信息收集和确认',
      type: 'dialogue',
      testCases: JSON.stringify([
        {
          input: {
            turns: [
              { role: 'user', content: '我想订一张去北京的机票' },
              { role: 'assistant', content: '好的，请问您什么时候出发？' },
              { role: 'user', content: '下周三' }
            ]
          },
          expected: {
            slots: {
              destination: '北京',
              date: 'next_wednesday'
            }
          }
        },
        {
          input: {
            turns: [
              { role: 'user', content: '查询一下天气' },
              { role: 'assistant', content: '请问您要查询哪个城市的天气？' },
              { role: 'user', content: '上海' },
              { role: 'assistant', content: '请问是今天还是明天的天气？' },
              { role: 'user', content: '明天' }
            ]
          },
          expected: {
            slots: {
              city: '上海',
              date: 'tomorrow'
            }
          }
        }
      ])
    }
  })

  console.log('✅ Created sample Dialogue Task')

  // Create sample Memory Task
  const memoryTask = await prisma.task.create({
    data: {
      name: '个人信息记忆测试',
      description: '测试记忆系统对个人信息的存储和召回',
      type: 'memory',
      testCases: JSON.stringify([
        {
          input: {
            history: [
              { role: 'user', content: '我叫张三，今年30岁' },
              { role: 'assistant', content: '你好张三，很高兴认识你' },
              { role: 'user', content: '我喜欢看科幻电影' }
            ],
            query: '你还记得我的年龄吗？'
          },
          expected: {
            recall: ['user_age'],
            responseContains: ['30']
          }
        },
        {
          input: {
            history: [
              { role: 'user', content: '我在北京工作' },
              { role: 'assistant', content: '北京是个好地方' },
              { role: 'user', content: '我是软件工程师' }
            ],
            query: '你知道我的职业吗？'
          },
          expected: {
            recall: ['user_occupation'],
            responseContains: ['软件工程师', 'engineer']
          }
        }
      ])
    }
  })

  console.log('✅ Created sample Memory Task')

  console.log('\n✨ Seeding completed successfully!')
  console.log(`\nCreated:
  - 3 built-in Agent templates
  - 3 sample tasks (Intent, Dialogue, Memory)
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
