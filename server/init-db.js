// Runs schema.sql against the configured Oracle schema. Safe to re-run —
// "already exists" errors are skipped.  Usage:  npm run init-db
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { withConnection, closePool } from './db.js'

const here = dirname(fileURLToPath(import.meta.url))

// ORA codes that just mean "this bit is already there".
const IGNORABLE = new Set([955, 1430, 2260, 1408, 1442, 1451])

const raw = await readFile(join(here, 'schema.sql'), 'utf8')

const statements = raw
  .replace(/^\s*--.*$/gm, '') // strip full-line comments
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean)

try {
  await withConnection(async (conn) => {
    for (const stmt of statements) {
      const label = stmt.split('\n')[0].slice(0, 68)
      try {
        await conn.execute(stmt)
        console.log('  ok   ', label)
      } catch (err) {
        if (IGNORABLE.has(err.errorNum)) {
          console.log(`  skip  ${label}  (ORA-${err.errorNum})`)
        } else {
          throw err
        }
      }
    }
    await conn.commit()
  })
  console.log('\nSchema ready.')
} catch (err) {
  console.error('\nFailed:', err.message)
  process.exitCode = 1
} finally {
  await closePool()
}
