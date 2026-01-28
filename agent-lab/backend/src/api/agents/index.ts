import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import type { CreateAgentTemplateDto, UpdateAgentTemplateDto } from '../../types/agent.js'

export const agentsRouter = Router()

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['intent', 'dialogue', 'memory']),
  description: z.string(),
  config: z.record(z.unknown()),
  systemPrompt: z.string(),
  isBuiltin: z.boolean().optional()
})

const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  systemPrompt: z.string().optional()
})

// GET /api/agents - Get all agents
agentsRouter.get('/', async (req, res, next) => {
  try {
    const { type } = req.query

    const agents = await prisma.agentTemplate.findMany({
      where: type ? { type: type as string } : undefined,
      orderBy: [
        { isBuiltin: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const formatted = agents.map(agent => ({
      ...agent,
      config: JSON.parse(agent.config)
    }))

    res.json({ data: formatted })
  } catch (error) {
    next(error)
  }
})

// GET /api/agents/:id - Get single agent
agentsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const agent = await prisma.agentTemplate.findUnique({
      where: { id }
    })

    if (!agent) {
      return res.status(404).json({
        error: { message: 'Agent not found' }
      })
    }

    res.json({
      data: {
        ...agent,
        config: JSON.parse(agent.config)
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/agents - Create new agent
agentsRouter.post('/', async (req, res, next) => {
  try {
    const validated = createAgentSchema.parse(req.body) as CreateAgentTemplateDto

    const agent = await prisma.agentTemplate.create({
      data: {
        name: validated.name,
        type: validated.type,
        description: validated.description,
        config: JSON.stringify(validated.config),
        systemPrompt: validated.systemPrompt,
        isBuiltin: validated.isBuiltin || false
      }
    })

    res.status(201).json({
      data: {
        ...agent,
        config: JSON.parse(agent.config)
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

// PUT /api/agents/:id - Update agent
agentsRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const validated = updateAgentSchema.parse(req.body) as UpdateAgentTemplateDto

    const existing = await prisma.agentTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Agent not found' }
      })
    }

    if (existing.isBuiltin) {
      return res.status(403).json({
        error: { message: 'Cannot modify built-in agent template' }
      })
    }

    const agent = await prisma.agentTemplate.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description && { description: validated.description }),
        ...(validated.config && { config: JSON.stringify(validated.config) }),
        ...(validated.systemPrompt && { systemPrompt: validated.systemPrompt })
      }
    })

    res.json({
      data: {
        ...agent,
        config: JSON.parse(agent.config)
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

// DELETE /api/agents/:id - Delete agent
agentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const existing = await prisma.agentTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Agent not found' }
      })
    }

    if (existing.isBuiltin) {
      return res.status(403).json({
        error: { message: 'Cannot delete built-in agent template' }
      })
    }

    await prisma.agentTemplate.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
