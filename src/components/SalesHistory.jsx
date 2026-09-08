import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatKES, formatDateTime, isSameDay } from '../lib/format'
import Receipt from './Receipt'

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'all', label: 'All' },
]

export default function SalesHistory() {
  const { sales, settings } = useApp()
  const [range, setRange] = useState('today')
  const [expanded, setExpanded] = useState(null)
  const [reprint, setReprint] = useState(null)

  const filtered = useMemo(() => {
    const now = Date.now()
    return sales.filter((s) => {
      if (range === 'all') return true
      if (range === 'today') return isSameDay(s.createdAt, now)
      return now - new Date(s.createdAt).getTime() <= 7 * 864e5
    })
  }, [sales, range])

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + s.totals.total, 0)
    return { count: filtered.length, total }
  }, [filtered])

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-3 sm:p-4">
      <div className="mb-3 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              range === r.id
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-white">
        <span className="text-sm text-slate-300">
          {summary.count} transaction{summary.count === 1 ? '' : 's'}
        </span>
        <span className="text-lg font-bold">{formatKES(summary.total)}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {filtered.map((s) => {
          const isOpen = expanded === s.id
          return (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div>
                  <p className="font-medium text-slate-800">{s.receiptNo}</p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(s.createdAt)} ·{' '}
                    <span className="capitalize">{s.payment.methodLabel}</span>
                  </p>
                </div>
                <span className="font-semibold text-slate-800">
                  {formatKES(s.totals.total)}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-3 py-2 text-sm">
                  <ul className="mb-2 space-y-1">
                    {s.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between text-slate-600">
                        <span>
                          {it.quantity} × {it.name}
                        </span>
                        <span>{formatKES(it.quantity * it.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT</span>
                    <span>{formatKES(s.totals.tax)}</span>
                  </div>
                  {s.totals.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Discount</span>
                      <span>−{formatKES(s.totals.discountAmount)}</span>
                    </div>
                  )}
                  {Array.isArray(s.payment.splits) && s.payment.splits.length ? (
                    s.payment.splits.map((sp, i) => (
                      <div key={i} className="flex justify-between text-slate-500">
                        <span>
                          {sp.methodLabel}
                          {sp.reference ? ` · ${sp.reference}` : ''}
                          {sp.method === 'cash' && sp.change > 0
                            ? ` · change ${formatKES(sp.change)}`
                            : ''}
                        </span>
                        <span>{formatKES(sp.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      {s.payment.method === 'cash' && (
                        <div className="flex justify-between text-slate-500">
                          <span>Cash / change</span>
                          <span>
                            {formatKES(s.payment.amount)} / {formatKES(s.payment.change)}
                          </span>
                        </div>
                      )}
                      {s.payment.reference && (
                        <div className="flex justify-between text-slate-500">
                          <span>Ref</span>
                          <span>{s.payment.reference}</span>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setReprint(s)}
                    className="mt-2 w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
                  >
                    View / reprint receipt
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            No sales in this period yet.
          </p>
        )}
      </div>

      <Receipt
        sale={reprint}
        settings={settings}
        open={!!reprint}
        onClose={() => setReprint(null)}
        onNewSale={() => setReprint(null)}
      />
    </div>
  )
}
