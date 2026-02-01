import type { Reporter } from '../contracts/report.js'

export class ReporterRegistry {
  private readonly reporters = new Map<string, Reporter>()

  register(reporter: Reporter): void {
    if (this.reporters.has(reporter.id)) {
      throw new Error(`Reporter "${reporter.id}" is already registered`)
    }
    this.reporters.set(reporter.id, reporter)
  }

  list(): Reporter[] {
    return Array.from(this.reporters.values())
  }
}
