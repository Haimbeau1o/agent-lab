// Simple logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class Logger {
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString()
    }

    if (data) {
      entry.data = data
    }

    const output = JSON.stringify(entry)

    switch (level) {
      case 'error':
        process.stderr.write(output + '\n')
        break
      default:
        process.stdout.write(output + '\n')
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data)
    }
  }
}

export const logger = new Logger()
