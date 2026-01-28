import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import type { CreateDatasetDto, UpdateDatasetDto } from '../../types/dataset.js'

export const datasetsRouter = Router()

// Validation schemas
const createDatasetSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['intent', 'dialogue', 'memory']),
  description: z.string().optional(),
  data: z.array(z.unknown())
})

const updateDatasetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  data: z.array(z.unknown()).optional()
})

// GET /api/datasets - Get all datasets
datasetsRouter.get('/', async (req, res, next) => {
  try {
    const { type } = req.query

    const datasets = await prisma.dataset.findMany({
      where: type ? { type: type as string } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    const formatted = datasets.map(dataset => ({
      ...dataset,
      data: JSON.parse(dataset.data)
    }))

    res.json({ data: formatted })
  } catch (error) {
    next(error)
  }
})

// GET /api/datasets/:id - Get single dataset
datasetsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const dataset = await prisma.dataset.findUnique({
      where: { id }
    })

    if (!dataset) {
      return res.status(404).json({
        error: { message: 'Dataset not found' }
      })
    }

    res.json({
      data: {
        ...dataset,
        data: JSON.parse(dataset.data)
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/datasets - Create new dataset
datasetsRouter.post('/', async (req, res, next) => {
  try {
    const validated = createDatasetSchema.parse(req.body) as CreateDatasetDto

    const dataset = await prisma.dataset.create({
      data: {
        name: validated.name,
        type: validated.type,
        description: validated.description || null,
        data: JSON.stringify(validated.data),
        size: validated.data.length
      }
    })

    res.status(201).json({
      data: {
        ...dataset,
        data: JSON.parse(dataset.data)
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

// PUT /api/datasets/:id - Update dataset
datasetsRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const validated = updateDatasetSchema.parse(req.body) as UpdateDatasetDto

    const existing = await prisma.dataset.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Dataset not found' }
      })
    }

    const dataset = await prisma.dataset.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description || null }),
        ...(validated.data && {
          data: JSON.stringify(validated.data),
          size: validated.data.length
        })
      }
    })

    res.json({
      data: {
        ...dataset,
        data: JSON.parse(dataset.data)
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

// DELETE /api/datasets/:id - Delete dataset
datasetsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const existing = await prisma.dataset.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Dataset not found' }
      })
    }

    await prisma.dataset.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
