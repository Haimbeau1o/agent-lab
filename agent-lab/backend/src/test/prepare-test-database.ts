import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..', '..')
const testDatabasePath = resolve(projectRoot, 'prisma', 'test.db')

export const TEST_DATABASE_URL = 'file:./test.db'

export function prepareTestDatabase(options?: { quiet?: boolean }): void {
  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath)
  }

  // Ensure the SQLite file exists before running migrate on external volumes.
  writeFileSync(testDatabasePath, '', { encoding: 'utf8' })

  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

  execFileSync(
    npxCommand,
    ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
      stdio: options?.quiet ? 'pipe' : 'inherit',
    },
  )
}

const invokedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (invokedAsScript) {
  prepareTestDatabase()
}
