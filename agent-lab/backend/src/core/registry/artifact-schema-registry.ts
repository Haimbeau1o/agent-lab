import type { ArtifactSchema } from '../contracts/artifact.js'

export class ArtifactSchemaRegistry {
  private readonly schemas = new Map<string, ArtifactSchema>()

  register(schema: ArtifactSchema): void {
    if (this.schemas.has(schema.id)) {
      throw new Error(`ArtifactSchema "${schema.id}" is already registered`)
    }
    this.schemas.set(schema.id, schema)
  }

  get(id: string): ArtifactSchema {
    const schema = this.schemas.get(id)
    if (!schema) {
      throw new Error(`No ArtifactSchema registered for "${id}"`)
    }
    return schema
  }
}
