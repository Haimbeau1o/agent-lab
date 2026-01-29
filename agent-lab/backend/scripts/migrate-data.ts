/**
 * 数据迁移脚本
 *
 * 将旧的 TestRun/TestResult 数据迁移到新的 RunRecord/ScoreRecord 格式
 */

import { PrismaClient } from '@prisma/client'
import type { RunRecord } from '../src/core/contracts/run-record.js'
import type { ScoreRecord } from '../src/core/contracts/score-record.js'

const prisma = new PrismaClient()

async function migrateData() {
  console.log('🚀 开始数据迁移...\n')

  try {
    // 1. 获取所有旧的 TestRun 数据
    const oldTestRuns = await prisma.testRun.findMany({
      include: {
        results: true,
        agent: true,
        task: true
      }
    })

    console.log(`📊 找到 ${oldTestRuns.length} 条 TestRun 记录`)

    if (oldTestRuns.length === 0) {
      console.log('✅ 没有需要迁移的数据')
      return
    }

    let migratedRuns = 0
    let migratedScores = 0

    // 2. 遍历每个 TestRun，转换为 RunRecord
    for (const testRun of oldTestRuns) {
      console.log(`\n处理 TestRun: ${testRun.id}`)

      // 跳过已经迁移的数据（检查是否已存在对应的 RunRecord）
      const existing = await prisma.runRecord.findFirst({
        where: {
          taskId: testRun.taskId,
          startedAt: testRun.startedAt
        }
      })

      if (existing) {
        console.log(`  ⏭️  已存在，跳过`)
        continue
      }

      // 3. 为每个 TestResult 创建一个 RunRecord
      for (const result of testRun.results) {
        try {
          // 解析 JSON 字段
          const input = JSON.parse(result.input)
          const output = JSON.parse(result.output)
          const expected = result.expected ? JSON.parse(result.expected) : undefined
          const metrics = JSON.parse(result.metrics)

          // 创建 RunRecord
          const runRecord: Omit<RunRecord, 'id'> = {
            taskId: testRun.taskId,
            taskType: 'atomic',
            status: testRun.status === 'completed' ? 'completed' :
                    testRun.status === 'failed' ? 'failed' :
                    testRun.status === 'running' ? 'running' : 'pending',
            output,
            metrics: {
              latency: result.latency,
              tokens: result.tokenCount ?? undefined,
              cost: undefined // 旧数据没有 cost 信息
            },
            trace: [
              {
                timestamp: result.createdAt,
                level: 'info',
                event: 'migrated_from_test_result',
                data: {
                  originalTestRunId: testRun.id,
                  originalTestResultId: result.id
                }
              }
            ],
            startedAt: testRun.startedAt,
            completedAt: testRun.completedAt ?? undefined,
            provenance: {
              runnerId: `${testRun.agent.type}.llm`,
              runnerVersion: '1.0.0',
              config: JSON.parse(testRun.agent.config)
            }
          }

          // 保存 RunRecord
          const savedRun = await prisma.runRecord.create({
            data: {
              id: `migrated-${result.id}`,
              taskId: runRecord.taskId,
              taskType: runRecord.taskType,
              status: runRecord.status,
              output: runRecord.output ? JSON.stringify(runRecord.output) : null,
              errorMessage: null,
              errorStep: null,
              errorStack: null,
              latency: runRecord.metrics.latency,
              tokens: runRecord.metrics.tokens ?? null,
              cost: runRecord.metrics.cost ?? null,
              trace: JSON.stringify(runRecord.trace),
              steps: null,
              startedAt: runRecord.startedAt,
              completedAt: runRecord.completedAt ?? null,
              runnerId: runRecord.provenance.runnerId,
              runnerVersion: runRecord.provenance.runnerVersion,
              config: JSON.stringify(runRecord.provenance.config)
            }
          })

          migratedRuns++

          // 4. 创建 ScoreRecords
          const scores: Omit<ScoreRecord, 'id'>[] = []

          // 从 metrics 中提取评分
          if (typeof metrics === 'object' && metrics !== null) {
            for (const [key, value] of Object.entries(metrics)) {
              if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
                scores.push({
                  runId: savedRun.id,
                  metric: key,
                  value,
                  target: 'final',
                  evidence: {
                    explanation: `Migrated from TestResult metrics.${key}`
                  },
                  evaluatorId: `${testRun.agent.type}.metrics`,
                  createdAt: result.createdAt
                })
              }
            }
          }

          // 添加 latency 评分
          scores.push({
            runId: savedRun.id,
            metric: 'latency',
            value: result.latency,
            target: 'global',
            evidence: {
              explanation: 'Execution latency in milliseconds'
            },
            evaluatorId: `${testRun.agent.type}.metrics`,
            createdAt: result.createdAt
          })

          // 如果有 isCorrect 字段，添加 accuracy 评分
          if (result.isCorrect !== null) {
            scores.push({
              runId: savedRun.id,
              metric: 'accuracy',
              value: result.isCorrect ? 1 : 0,
              target: 'final',
              evidence: {
                explanation: result.isCorrect ? 'Output matches expected' : 'Output does not match expected',
                alignment: {
                  expected,
                  actual: output
                }
              },
              evaluatorId: `${testRun.agent.type}.metrics`,
              createdAt: result.createdAt
            })
          }

          // 保存 ScoreRecords
          for (const score of scores) {
            await prisma.scoreRecord.create({
              data: {
                runId: score.runId,
                metric: score.metric,
                valueNumber: typeof score.value === 'number' ? score.value : null,
                valueBoolean: typeof score.value === 'boolean' ? score.value : null,
                valueString: typeof score.value === 'string' ? score.value : null,
                target: score.target,
                explanation: score.evidence?.explanation ?? null,
                snippets: score.evidence?.snippets ? JSON.stringify(score.evidence.snippets) : null,
                alignment: score.evidence?.alignment ? JSON.stringify(score.evidence.alignment) : null,
                evaluatorId: score.evaluatorId,
                createdAt: score.createdAt
              }
            })
            migratedScores++
          }

          console.log(`  ✅ 迁移 TestResult ${result.id} -> RunRecord ${savedRun.id} (${scores.length} scores)`)
        } catch (error) {
          console.error(`  ❌ 迁移 TestResult ${result.id} 失败:`, error)
        }
      }
    }

    console.log(`\n✅ 数据迁移完成!`)
    console.log(`   - 迁移了 ${migratedRuns} 条 RunRecord`)
    console.log(`   - 迁移了 ${migratedScores} 条 ScoreRecord`)
  } catch (error) {
    console.error('❌ 数据迁移失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行迁移
migrateData()
  .then(() => {
    console.log('\n🎉 迁移脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 迁移脚本执行失败:', error)
    process.exit(1)
  })
