# Nox Lounge POS — Oracle sync backend

A small Express API that receives completed sales from the POS and stores them
in an Oracle database. The POS keeps working fully offline; this is only used
when it flushes its queue.

Uses **node-oracledb in Thin mode** — pure JavaScript, so **no Oracle Client /
Instant Client install and no C++ build tools are needed**.

```
POS (browser, IndexedDB queue)  ──POST /pos/sales──▶  this API  ──▶  Oracle
```

---

## Already set up on this machine (2026-09-04)

- Oracle 21c XE is running locally — service **XEPDB1** on port 1521.
- Schema **`nox_pos`** created (password in `server/.env`), tables + view built.
- `server/.env` filled in, POS root `.env` has `VITE_SYNC_URL=http://localhost:3001/pos/sales`.
- Full round-trip tested: browser sale → `Sync now` → row in `pos_sales`.

**To run it:** two terminals —

```bash
# terminal 1 — the API
cd C:\Users\pc\pos\server && npm start

# terminal 2 — the POS
cd C:\Users\pc\pos && npm run dev
```

Then use the POS at http://localhost:5173/ ; **Dashboard → Sync now** pushes
sales into Oracle.

**To see the data in VS Code:** SQL Developer extension → new connection →
Host `localhost`, Port `1521`, Service `XEPDB1`, User `nox_pos`, password from
`server/.env` → run `SELECT * FROM pos_sales;`.

The sections below are the from-scratch reference (e.g. for another machine).

---

## 1. Connect VS Code to Oracle

The **Oracle SQL Developer Extension for VSCode** is already installed on this
machine. In VS Code:

1. Open the **SQL Developer** icon in the Activity Bar → **Create Connection**.
2. Fill in: Host `localhost`, Port `1521`, Service name `XEPDB1` (or your
   server's host / service), plus username & password.
3. **Connect**, then use it to open and run the `.sql` files below.

## 2. Create the schema

If you need a dedicated user, run [`create-user.sql`](create-user.sql) as a DBA
(connected as `SYSTEM`). Otherwise use any schema you already have.

Then create the tables — either open [`schema.sql`](schema.sql) in the Oracle
extension and **Run Script**, or let the app do it:

```bash
cd server
cp .env.example .env         # then edit .env with your real credentials
npm install
npm run init-db              # runs schema.sql (safe to re-run)
```

Tables created: `pos_sales`, `pos_sale_items`, view `pos_daily_totals`.

## 3. Run the API

```bash
npm start          # http://localhost:3001
# or:  npm run dev  (auto-restart on file changes)
```

Check it: `curl http://localhost:3001/health` → `{"ok":true,"db":"up"}`

| route | purpose |
|---|---|
| `POST /pos/sales` | receive one sale (the POS's local record). Idempotent — re-posting the same `id` returns 2xx without duplicating. |
| `GET /pos/sales?limit=50` | recent sales, newest first |
| `GET /health` | database connectivity check |

## 4. Point the POS at it

In the **POS project root** (`..`):

```bash
cp .env.example .env
```

and set:

```
VITE_SYNC_URL=http://localhost:3001/pos/sales
```

Restart `npm run dev`. Now the POS's **Dashboard → Sync now** button (and the
automatic flush when connectivity returns) will push queued sales into Oracle.
Each sale is removed from the local queue only after the API returns 2xx.

## Data model

`pos_sales` holds one row per sale (header + payment + the full original JSON in
`raw_json`), `pos_sale_items` holds one row per line. Both are written in a
single transaction.

**Split payments:** a sale settled across methods stores `payment_method =
'split'` with `payment_amount` = the total taken and `payment_ref` = the joined
references. The per-method legs (`payment.splits[]`) live only in `raw_json`.
`pos_daily_totals` gets a `split` column for these; `pos_tender_totals` unpacks
them so cash / M-Pesa / card takings stay accurate. After pulling this change,
re-apply the views (they are `CREATE OR REPLACE`, no data migration):

```sql
-- run just the two CREATE OR REPLACE VIEW statements from schema.sql
```

```sql
SELECT * FROM pos_daily_totals ORDER BY sale_day DESC;

SELECT s.receipt_no, s.created_at, i.name, i.quantity, i.line_total
FROM   pos_sales s JOIN pos_sale_items i ON i.sale_id = s.id
ORDER  BY s.created_at DESC;
```

## Notes / next steps

- **Auth**: none yet. Fine for a till and API on the same LAN; add a shared
  secret header before exposing it beyond that.
- The POS never deletes local sales, so IndexedDB stays the source of truth and
  Oracle is a durable copy for reporting.
- To reset during testing: `DELETE FROM pos_sales;` (items cascade).
