import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatKES, isSameDay } from '../lib/format'
import { syncPendingSales } from '../lib/sync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { sales, products, pendingCount, reloadSales, settings } = useApp()
  const online = useOnlineStatus()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const today = useMemo(() => {
    const now = Date.now()
    const todays = sales.filter((s) => isSameDay(s.createdAt, now))
    const total = todays.reduce((sum, s) => sum + s.totals.total, 0)
    const cash = todays
      .filter((s) => s.payment.method === 'cash')
      .reduce((sum, s) => sum + s.totals.total, 0)
    return {
      total,
      count: todays.length,
      avg: todays.length ? total / todays.length : 0,
      cash,
      nonCash: total - cash,
    }
  }, [sales])

  const topProducts = useMemo(() => {
    const tally = new Map()
    for (const s of sales) {
      for (const it of s.items) {
        const key = it.productId || it.name
        const cur = tally.get(key) || { name: it.name, qty: 0, revenue: 0 }
        cur.qty += it.quantity
        cur.revenue += it.quantity * it.price
        tally.set(key, cur)
      }
    }
    return [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [sales])

  const lowStock = products.filter((p) => p.stock <= 5)

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await syncPendingSales()
      await reloadSales()
      if (res.stub) {
        setSyncMsg(
          res.remaining
            ? `${res.remaining} sale(s) queued. No backend connected yet (sync is stubbed).`
            : 'Nothing to sync.',
        )
      } else if (res.offline) {
        setSyncMsg('Still offline — try again when connected.')
      } else {
        setSyncMsg(`Synced ${res.synced}. ${res.remaining} remaining.`)
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto h-full max-w-3xl space-y-4 overflow-y-auto p-3 sm:p-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{settings.storeName}</h1>
        <p className="text-sm text-slate-400">Today at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Sales today" value={formatKES(today.total)} />
        <Stat label="Transactions" value={today.count} hint={`Avg ${formatKES(today.avg)}`} />
        <Stat label="Cash" value={formatKES(today.cash)} />
        <Stat label="M-Pesa / Card" value={formatKES(today.nonCash)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Pending sync</p>
            <p className="text-xs text-slate-400">
              {pendingCount} sale{pendingCount === 1 ? '' : 's'} stored locally
              {online ? '' : ' · offline'}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white active:bg-slate-900 disabled:opacity-40"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {syncMsg && <p className="mt-2 text-xs text-slate-500">{syncMsg}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 font-semibold text-slate-800">Top sellers</p>
        {topProducts.length === 0 && (
          <p className="text-sm text-slate-400">No sales recorded yet.</p>
        )}
        <ol className="space-y-2">
          {topProducts.map((p, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  {i + 1}
                </span>
                <span className="text-slate-700">{p.name}</span>
              </span>
              <span className="text-slate-500">
                {p.qty} sold · {formatKES(p.revenue)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-semibold text-amber-800">Low stock</p>
          <ul className="space-y-1 text-sm text-amber-700">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="font-semibold">
                  {p.stock <= 0 ? 'Out' : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
