import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '../../lib/prisma.js'
import type { CreateApiConfigDto, UpdateApiConfigDto } from '../../types/api-config.js'

export const settingsRouter = Router()

// Validate encryption configuration
const rawEncryptionKey = process.env.ENCRYPTION_KEY
const rawEncryptionSalt = process.env.ENCRYPTION_SALT

if (!rawEncryptionKey || rawEncryptionKey.length < 32) {
  throw new Error('ENCRYPTION_KEY environment variable must be set and at least 32 characters long')
}

if (!rawEncryptionSalt || Buffer.from(rawEncryptionSalt, 'hex').length < 16) {
  throw new Error('ENCRYPTION_SALT environment variable must be set and at least 32 hex characters (16 bytes)')
}

const ENCRYPTION_KEY: string = rawEncryptionKey
const ENCRYPTION_SALT: string = rawEncryptionSalt
const ALGORITHM = 'aes-256-cbc'
const SALT_BUFFER = Buffer.from(ENCRYPTION_SALT, 'hex')

// Encryption/decryption functions with secure salt
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, SALT_BUFFER, 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const key = crypto.scryptSync(ENCRYPTION_KEY, SALT_BUFFER, 32)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

// Validation schemas
const createApiConfigSchema = z.object({
  name: z.string().min(1).max(255),
  provider: z.enum(['openai', 'anthropic', 'custom']),
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
  modelName: z.string().min(1),
  isDefault: z.boolean().optional()
})

const updateApiConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  modelName: z.string().min(1).optional(),
  isDefault: z.boolean().optional()
})

// Helper function to safely mask API keys
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '****'
  }
  return `${apiKey.substring(0, 4)}${'*'.repeat(8)}`
}

// GET /api/settings/api-config - Get all API configs
settingsRouter.get('/api-config', async (_req, res, next) => {
  try {
    const configs = await prisma.apiConfig.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Don't expose full API keys
    const formatted = configs.map(config => ({
      ...config,
      apiKey: maskApiKey(config.apiKey)
    }))

    res.json({ data: formatted })
  } catch (error) {
    next(error)
  }
})

// GET /api/settings/api-config/:id - Get single API config
settingsRouter.get('/api-config/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const config = await prisma.apiConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return res.status(404).json({
        error: { message: 'API config not found' }
      })
    }

    // Don't expose full API key
    res.json({
      data: {
        ...config,
        apiKey: maskApiKey(config.apiKey)
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/settings/api-config - Create new API config
settingsRouter.post('/api-config', async (req, res, next) => {
  try {
    const validated = createApiConfigSchema.parse(req.body) as CreateApiConfigDto

    // If this is set as default, unset all others
    if (validated.isDefault) {
      await prisma.apiConfig.updateMany({
        data: { isDefault: false }
      })
    }

    // Encrypt API key
    const encryptedKey = encrypt(validated.apiKey)

    const config = await prisma.apiConfig.create({
      data: {
        name: validated.name,
        provider: validated.provider,
        apiKey: encryptedKey,
        baseUrl: validated.baseUrl,
        modelName: validated.modelName,
        isDefault: validated.isDefault || false
      }
    })

    res.status(201).json({
      data: {
        ...config,
        apiKey: maskApiKey(validated.apiKey)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.errors
        }
      })
    }
    next(error)
  }
})

// PUT /api/settings/api-config/:id - Update API config
settingsRouter.put('/api-config/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const validated = updateApiConfigSchema.parse(req.body) as UpdateApiConfigDto

    const existing = await prisma.apiConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'API config not found' }
      })
    }

    // If this is set as default, unset all others
    if (validated.isDefault) {
      await prisma.apiConfig.updateMany({
        data: { isDefault: false }
      })
    }

    const updateData: Record<string, unknown> = {}
    if (validated.name) updateData.name = validated.name
    if (validated.apiKey) updateData.apiKey = encrypt(validated.apiKey)
    if (validated.baseUrl) updateData.baseUrl = validated.baseUrl
    if (validated.modelName) updateData.modelName = validated.modelName
    if (validated.isDefault !== undefined) updateData.isDefault = validated.isDefault

    const config = await prisma.apiConfig.update({
      where: { id },
      data: updateData
    })

    res.json({
      data: {
        ...config,
        apiKey: maskApiKey(config.apiKey)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.errors
        }
      })
    }
    next(error)
  }
})

// DELETE /api/settings/api-config/:id - Delete API config
settingsRouter.delete('/api-config/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const existing = await prisma.apiConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'API config not found' }
      })
    }

    await prisma.apiConfig.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// POST /api/settings/api-config/:id/test - Test API connection
settingsRouter.post('/api-config/:id/test', async (req, res, _next) => {
  try {
    const { id } = req.params

    const config = await prisma.apiConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return res.status(404).json({
        error: { message: 'API config not found' }
      })
    }

    // Decrypt API key
    const apiKey = decrypt(config.apiKey)

    // Test connection with a simple request
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'API connection failed',
        status: response.status
      })
    }

    res.json({
      success: true,
      message: 'API connection successful'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    })
  }
})

// Export encryption functions for use in other modules
export { encrypt, decrypt }
