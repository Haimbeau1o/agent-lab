import { AgentType } from './agent.js'

// 数据集类型
export interface Dataset {
  id: string
  name: string
  type: AgentType
  description?: string
  data: unknown[]
  size: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateDatasetDto {
  name: string
  type: AgentType
  description?: string
  data: unknown[]
}

export interface UpdateDatasetDto {
  name?: string
  description?: string
  data?: unknown[]
}
