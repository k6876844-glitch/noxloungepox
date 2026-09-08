import express from 'express'
import cors from 'cors'
import oracledb from 'oracledb'
import 'dotenv/config'
import { withConnection, closePool } from './db.js'

const app = express()

const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(cors({ origin: origins }))
app.use(express.json({ limit: '2mb' }))

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// --- health -------------------------------------------------------------
app.get('/health', async (_req, res) => {
  try {
    await withConnection((c) => c.execute('SELECT 1 AS ok FROM dual'))
    res.json({ ok: true, db: 'up' })
  } catch (err) {
    res.status(503).json({ ok: false, db: 'down', error: err.message })
  }
})

// --- receive a sale ---------------------------------------------------------
// The POS posts one sale (the full local record) per request and only drops it
// from its offline queue on a 2xx. Idempotent: re-posting the same id is a
// no-op that still returns 2xx, so retries after a flaky connection are safe.
app.post('/pos/sales', async (req, res) => {
  const sale = req.body
  if (!sale || typeof sale.id !== 'string' || !Array.isArray(sale.items)) {
    return res.status(400).json({ ok: false, error: 'Malformed sale payload' })
  }

  const t = sale.totals || {}
  const p = sale.payment || {}

  try {
    const outcome = await withConnection(async (conn) => {
      const existing = await conn.execute(
        'SELECT id FROM pos_sales WHERE id = :id',
        { id: sale.id },
      )
      if (existing.rows.length) return 'duplicate'

      await conn.execute(
        `INSERT INTO pos_sales
           (id, receipt_no, created_at, subtotal, discount_amount, tax, total,
            payment_method, payment_amount, payment_change, payment_ref, raw_json)
         VALUES
           (:id, :receipt_no, :created_at, :subtotal, :discount_amount, :tax, :total,
            :payment_method, :payment_amount, :payment_change, :payment_ref, :raw_json)`,
        {
          id: sale.id,
          receipt_no: sale.receiptNo ?? null,
          created_at: {
            val: sale.createdAt ? new Date(sale.createdAt) : new Date(),
            type: oracledb.DB_TYPE_TIMESTAMP_TZ,
          },
          subtotal: num(t.subtotal),
          discount_amount: num(t.discountAmount),
          tax: num(t.tax),
          total: num(t.total),
          payment_method: p.method ?? null,
          payment_amount: num(p.amount),
          payment_change: num(p.change),
          payment_ref: p.reference ? String(p.reference).slice(0, 64) : null,
          raw_json: JSON.stringify(sale),
        },
      )

      for (let i = 0; i < sale.items.length; i++) {
        const it = sale.items[i] || {}
        await conn.execute(
          `INSERT INTO pos_sale_items
             (sale_id, line_no, product_id, name, sku, unit_price, quantity, line_total)
           VALUES (:sale_id, :line_no, :product_id, :name, :sku, :unit_price, :quantity, :line_total)`,
          {
            sale_id: sale.id,
            line_no: i + 1,
            product_id: it.productId ?? null,
            name: it.name ?? null,
            sku: it.sku || null,
            unit_price: num(it.price),
            quantity: num(it.quantity),
            line_total: num(it.price) * num(it.quantity),
          },
        )
      }

      await conn.commit()
      return 'inserted'
    })

    res
      .status(outcome === 'inserted' ? 201 : 200)
      .json({ ok: true, id: sale.id, outcome })
  } catch (err) {
    console.error('[POST /pos/sales]', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// --- read back (sanity checks / simple reporting) -------------------------
app.get('/pos/sales', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500)
  try {
    const { rows } = await withConnection((c) =>
      c.execute(
        `SELECT id, receipt_no, created_at, total, payment_method
           FROM pos_sales
          ORDER BY created_at DESC
          FETCH FIRST :limit ROWS ONLY`,
        { limit },
      ),
    )
    res.json({ ok: true, count: rows.length, sales: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

const PORT = Number(process.env.PORT) || 3001
const server = app.listen(PORT, () => {
  console.log(`Nox Lounge POS sync API  →  http://localhost:${PORT}`)
  console.log('  POST /pos/sales   receive a sale (idempotent)')
  console.log('  GET  /pos/sales   recent sales')
  console.log('  GET  /health      database check')
  console.log(`  CORS origins: ${origins.join(', ')}`)
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(async () => {
      await closePool()
      process.exit(0)
    })
  })
}
