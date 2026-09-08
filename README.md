# Nox Lounge POS — offline-first bar Point of Sale

A touch-friendly PWA point of sale for Nox Lounge. Runs entirely in the
browser, works with **no internet**, and installs to a phone, tablet, or
desktop. Currency is Kenyan Shilling (KES); menu prices are VAT-inclusive.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173

# production build + local preview (service worker only runs here / in prod)
npm run build
npm run preview
```

The first launch seeds a sample club menu (beers, spirits by the tot, full
bottles, cocktails, shots, soft drinks, kitchen, cover charge) so you can serve
straight away. Settings → **Reset to sample club menu** reloads it later.

## Deploy to Render

The repo ships a [`render.yaml`](render.yaml) Blueprint.

1. Push this repo to GitHub (done).
2. Render dashboard → **New → Blueprint** → pick the `noxloungepox` repo → **Apply**.
3. Render creates **nox-pos** (static PWA) — it goes live at
   `https://nox-pos.onrender.com` and needs no configuration; the POS is
   fully usable from there, queuing sales locally.
4. The Blueprint also defines **nox-pos-api** (the Oracle sync backend). It
   only works against a database Render can reach — **a local Oracle XE on
   your PC is not reachable from the cloud.** Use Oracle Cloud (Autonomous
   DB) or a publicly reachable Oracle, then set `ORACLE_USER`,
   `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING` on that service. Finally set
   `VITE_SYNC_URL` on **nox-pos** to `https://nox-pos-api.onrender.com/pos/sales`
   and redeploy. If you don't need cloud sync yet, delete the `nox-pos-api`
   service — the POS is unaffected.

## Deploy to Netlify

The repo ships [`netlify.toml`](netlify.toml) — build, publish dir, SPA
fallback and service-worker headers are all preconfigured.

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → **GitHub** → pick `noxloungepox`.
2. Leave every field as detected (Netlify reads `netlify.toml`) → **Deploy**.
3. Live in ~1 min at `https://<random-name>.netlify.app` — rename it in
   **Site configuration → Change site name**.
4. Cloud sync (optional): **Site configuration → Environment variables** →
   add `VITE_SYNC_URL` = your API's `/pos/sales` URL → **Deploys →
   Trigger deploy**.

Unlike Render's free tier, Netlify doesn't sleep — better for the till.

Other static hosts work the same way (`npm run build` → deploy `dist/`):
Cloudflare Pages, GitHub Pages, Vercel.

## What it does

| Area | Details |
|---|---|
| **Bar screen** | Search the menu or scan an item code, tap to add, adjust quantities, order-level discount (KES or %), live subtotal / VAT / total. |
| **Checkout** | Cash (quick-cash buttons + change due), M-Pesa or Card (with reference / transaction code). Fast, few taps. **Split tender:** if a payment doesn't cover the bill, tap **+ Add another payment** to settle the rest on a different method — e.g. KES 3,000 cash then KES 600 M-Pesa, in any order. Change is worked out per cash leg. |
| **Receipt** | 58 mm-style itemised receipt, printed via the browser print dialog. `receiptToEscPos()` in `src/lib/receipt.js` is a ready stub for a real thermal printer. |
| **Dashboard** | Two views via a toggle at the top: **Overview** (day's numbers, sync) and **Menu** (add / edit / delete items — name, price, item code, stock qty, category; quick restock via the stock pill on each row). |
| **Admin lock** | Dashboard and Settings sit behind a **manager PIN** (default `1234`, change it in Settings). The Bar and History screens never ask for it, so cashiers can only sell — not edit stock, prices, or settings. Unlock lasts until the browser is closed; "🔓 Lock admin" in the header ends it sooner. |
| **History** | Past orders by day / 7 days / all, expandable line items, reprint. |
| **Dashboard** | Tonight's sales, order count, cash vs M-Pesa/Card split, top sellers, low-stock list. |
| **Offline** | All data in IndexedDB (`idb`). Every sale is queued in a `pendingSync` store. Online/offline badge in the header. |
| **PWA** | Service worker precaches the app shell; cache-first for static assets; installable via web manifest. |

## Data & storage

Everything lives in one IndexedDB database (`duka-pos`) on the device:
`products`, `sales`, `pendingSync`, `settings`. Nothing is sent anywhere.

`recordSale()` writes the sale, queues it for sync, and decrements stock in a
single transaction.

## Syncing to a backend (stubbed)

`src/lib/sync.js` holds the queue-flush logic. With no backend configured it
runs in **stub mode** — it reports what would sync and keeps the queue intact.
To enable real upload, set an endpoint:

```bash
echo "VITE_SYNC_URL=https://your-api.example.com/pos/sales" > .env
```

Each pending sale is then `POST`ed as JSON and removed from the queue only on a
2xx response. The queue also flushes automatically when connectivity returns.

## Thermal printer (later)

`window.print()` + the `@media print` rules in `src/index.css` produce a narrow
receipt today. `receiptToEscPos(sale, settings)` returns an ESC/POS byte stream
for a 58 mm printer — wire it to Web Serial / WebUSB or a local print bridge
when you have the hardware. `receiptToText()` is the shared layout used by both.

## Project layout

```
src/
  db/          IndexedDB: schema, products, sales, settings, seed menu
  lib/         cart math, KES formatting, receipt rendering, sync
  hooks/       useOnlineStatus
  context/     AppContext — products, sales, settings, cart state
  components/  ProductList, Cart, Checkout, Receipt, SalesHistory,
               Dashboard, ProductForm, plus screen shells
```

Default club identity (name, address, VAT rate, receipt footer) lives in
`src/db/settings.js` and is editable at runtime in Settings.

## Regenerating icons

`npm run icons` rebuilds `public/icon-192.png`, `public/icon-512.png` and
`public/favicon.svg` (zero-dependency generator in `scripts/gen-icons.mjs`).
