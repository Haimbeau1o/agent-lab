import type {
  TaskDefinition,
  WorkflowDefinition,
  MethodDefinition
} from '../contracts/definitions.js'

export class TaskDefinitionRegistry {
  private readonly tasks = new Map<string, TaskDefinition>()

  register(definition: TaskDefinition): void {
    if (this.tasks.has(definition.id)) {
      throw new Error(`TaskDefinition "${definition.id}" is already registered`)
    }
    this.tasks.set(definition.id, definition)
  }

  list(): TaskDefinition[] {
    return Array.from(this.tasks.values())
  }
}

export class WorkflowDefinitionRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>()

  register(definition: WorkflowDefinition): void {
    if (this.workflows.has(definition.id)) {
      throw new Error(`WorkflowDefinition "${definition.id}" is already registered`)
    }
    this.workflows.set(definition.id, definition)
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }
}

export class MethodDefinitionRegistry {
  private readonly methods = new Map<string, MethodDefinition>()

  register(definition: MethodDefinition): void {
    if (this.methods.has(definition.id)) {
      throw new Error(`MethodDefinition "${definition.id}" is already registered`)
    }
    this.methods.set(definition.id, definition)
  }

  list(): MethodDefinition[] {
    return Array.from(this.methods.values())
  }
}
