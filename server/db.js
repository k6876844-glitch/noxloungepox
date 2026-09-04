import oracledb from 'oracledb'
import 'dotenv/config'

// Thin mode (pure JavaScript, no Oracle Client install needed) is the default
// in node-oracledb 6+. Nothing to configure here.

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
oracledb.autoCommit = false

let pool

export async function getPool() {
  if (!pool) {
    if (!process.env.ORACLE_USER || !process.env.ORACLE_CONNECT_STRING) {
      throw new Error(
        'Oracle connection not configured. Copy server/.env.example to server/.env and fill it in.',
      )
    }
    pool = await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 0,
      poolMax: 4,
      poolIncrement: 1,
      poolTimeout: 60,
    })
  }
  return pool
}

/** Run `fn` with a pooled connection, always released afterwards. */
export async function withConnection(fn) {
  const conn = await (await getPool()).getConnection()
  try {
    return await fn(conn)
  } finally {
    try {
      await conn.close()
    } catch {
      /* ignore */
    }
  }
}

export async function closePool() {
  if (pool) {
    await pool.close(5)
    pool = undefined
  }
}
