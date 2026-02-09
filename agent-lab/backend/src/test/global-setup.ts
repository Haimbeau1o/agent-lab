import { prepareTestDatabase, TEST_DATABASE_URL } from './prepare-test-database.js'

export default async function globalSetup(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL
  prepareTestDatabase({ quiet: true })
}
