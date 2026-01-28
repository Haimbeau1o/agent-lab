import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { agentsRouter } from './api/agents/index.js'
import { tasksRouter } from './api/tasks/index.js'
import { datasetsRouter } from './api/datasets/index.js'
import { testRunsRouter } from './api/test-runs/index.js'
import { settingsRouter } from './api/settings/index.js'
import { logger } from './lib/utils/logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Configure CORS with whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: { message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false
})

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter)

// Body parser with size limit
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/agents', agentsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/datasets', datasetsRouter)
app.use('/api/test-runs', testRunsRouter)
app.use('/api/settings', settingsRouter)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  res.status(500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.path
    }
  })
})

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    url: `http://localhost:${PORT}`
  })
})

export default app
