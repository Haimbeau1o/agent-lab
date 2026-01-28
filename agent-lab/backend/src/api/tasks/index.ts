import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import type { CreateTaskDto, UpdateTaskDto } from '../../types/task.js'

export const tasksRouter = Router()

// Validation schemas
const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  type: z.enum(['intent', 'dialogue', 'memory']),
  testCases: z.array(z.object({
    input: z.unknown(),
    expected: z.unknown().optional()
  }))
})

const updateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  testCases: z.array(z.object({
    input: z.unknown(),
    expected: z.unknown().optional()
  })).optional()
})

// GET /api/tasks - Get all tasks
tasksRouter.get('/', async (req, res, next) => {
  try {
    const { type } = req.query

    const tasks = await prisma.task.findMany({
      where: type ? { type: type as string } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    const formatted = tasks.map(task => ({
      ...task,
      testCases: JSON.parse(task.testCases)
    }))

    res.json({ data: formatted })
  } catch (error) {
    next(error)
  }
})

// GET /api/tasks/:id - Get single task
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return res.status(404).json({
        error: { message: 'Task not found' }
      })
    }

    res.json({
      data: {
        ...task,
        testCases: JSON.parse(task.testCases)
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/tasks - Create new task
tasksRouter.post('/', async (req, res, next) => {
  try {
    const validated = createTaskSchema.parse(req.body) as CreateTaskDto

    const task = await prisma.task.create({
      data: {
        name: validated.name,
        description: validated.description,
        type: validated.type,
        testCases: JSON.stringify(validated.testCases)
      }
    })

    res.status(201).json({
      data: {
        ...task,
        testCases: JSON.parse(task.testCases)
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

// PUT /api/tasks/:id - Update task
tasksRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const validated = updateTaskSchema.parse(req.body) as UpdateTaskDto

    const existing = await prisma.task.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Task not found' }
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description && { description: validated.description }),
        ...(validated.testCases && { testCases: JSON.stringify(validated.testCases) })
      }
    })

    res.json({
      data: {
        ...task,
        testCases: JSON.parse(task.testCases)
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

// DELETE /api/tasks/:id - Delete task
tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const existing = await prisma.task.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        error: { message: 'Task not found' }
      })
    }

    await prisma.task.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
