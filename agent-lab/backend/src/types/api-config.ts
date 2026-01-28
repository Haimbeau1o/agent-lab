// API 配置类型
export interface ApiConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  modelName: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateApiConfigDto {
  name: string
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  modelName: string
  isDefault?: boolean
}

export interface UpdateApiConfigDto {
  name?: string
  apiKey?: string
  baseUrl?: string
  modelName?: string
  isDefault?: boolean
}
