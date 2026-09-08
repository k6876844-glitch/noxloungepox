import { useMemo, useState } from 'react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'
import { recordSale, nextReceiptNo } from '../db/sales'
import { reconcileTenders } from '../lib/cart'

const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'card', label: 'Card' },
]

const QUICK_CASH = [50, 100, 200, 500, 1000]

const labelFor = (m) => METHODS.find((x) => x.id === m)?.label || m

export default function Checkout({ open, onClose, onSuccess }) {
  const { cart, totals, clearCart, reloadProducts, reloadSales, currentUser } =
    useApp()
  const [rows, setRows] = useState([{ method: 'cash', amount: '', reference: '' }])
  const [busy, setBusy] = useState(false)

  const total = totals.total
  const recon = useMemo(() => reconcileTenders(rows, total), [rows, total])
  const isSplit = rows.length > 1

  const missingRef = recon.lines.some(
    (l, i) => rows[i].method !== 'cash' && l.entered > 0 && !l.reference,
  )
  const canComplete =
    !busy &&
    cart.length > 0 &&
    recon.settled &&
    !recon.overpaidNonCash &&
    !missingRef

  function reset() {
    setRows([{ method: 'cash', amount: '', reference: '' }])
    setBusy(false)
  }

  const patchRow = (i, patch) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  function setRowMethod(i, method) {
    setRows((rs) =>
      rs.map((r, idx) => {
        if (idx !== i) return r
        const next = { ...r, method, reference: '' }
        // M-Pesa / card usually settle the exact balance — prefill it.
        if (method !== 'cash' && !r.amount) {
          next.amount = String(recon.lines[i]?.due ?? total)
        }
        return next
      }),
    )
  }

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { method: 'mpesa', amount: String(recon.outstanding || ''), reference: '' },
    ])

  const removeRow = (i) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)))

  async function complete() {
    if (!canComplete) return
    setBusy(true)
    try {
      const active = recon.lines.filter((l) => l.entered > 0)
      const split = active.length > 1

      let payment
      if (split) {
        payment = {
          method: 'split',
          methodLabel: 'Split',
          amount: recon.paid, // applied to the bill, excludes change
          change: recon.changeDue,
          reference: active
            .filter((l) => l.reference)
            .map((l) => `${labelFor(l.method)}: ${l.reference}`)
            .join(' · '),
          splits: active.map((l) => ({
            method: l.method,
            methodLabel: labelFor(l.method),
            amount: l.amount,
            tendered: l.method === 'cash' ? l.entered : undefined,
            change: l.change,
            reference: l.method === 'cash' ? '' : l.reference,
          })),
        }
      } else {
        const only = active[0] || {
          method: 'cash',
          entered: total,
          amount: total,
          change: 0,
          reference: '',
        }
        payment = {
          method: only.method,
          methodLabel: labelFor(only.method),
          amount: only.method === 'cash' ? only.entered || total : total,
          change: only.method === 'cash' ? only.change : 0,
          reference: only.method === 'cash' ? '' : only.reference,
        }
      }

      const sale = {
        receiptNo: await nextReceiptNo(),
        createdAt: new Date().toISOString(),
        cashier: currentUser?.username || '',
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          price: i.price,
          quantity: i.quantity,
        })),
        totals,
        payment,
      }
      const saved = await recordSale(sale)
      await Promise.all([reloadProducts(), reloadSales()])
      clearCart()
      reset()
      onSuccess(saved)
    } catch (err) {
      console.error('Checkout failed', err)
      alert('Could not save the sale. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Checkout"
      footer={
        <button
          onClick={complete}
          disabled={!canComplete}
          className="w-full rounded-xl bg-teal-600 py-4 text-lg font-bold text-white active:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Saving…' : `Complete Sale · ${formatKES(total)}`}
        </button>
      }
    >
      <div className="mb-4 flex items-baseline justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-500">Amount due</span>
        <span className="text-2xl font-bold text-slate-900">{formatKES(total)}</span>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => {
          const line = recon.lines[i] || { due: total, entered: 0, change: 0 }
          const isCash = row.method === 'cash'
          const overpaid = !isCash && line.entered > 0 && line.entered - line.due > 0.001
          return (
            <div
              key={i}
              className={isSplit ? 'rounded-xl border border-slate-200 p-3' : ''}
            >
              {isSplit && (
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payment {i + 1}
                  </span>
                  <button
                    onClick={() => removeRow(i)}
                    className="text-xs font-medium text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="mb-3 grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setRowMethod(i, m.id)}
                    className={`rounded-xl py-3 text-sm font-semibold ${
                      row.method === m.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-slate-600">
                {isCash ? 'Cash received' : 'Amount charged'}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={row.amount}
                onChange={(e) => patchRow(i, { amount: e.target.value })}
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-right text-xl font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => patchRow(i, { amount: String(line.due) })}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
                >
                  Owed {formatKES(line.due)}
                </button>
                {isCash &&
                  QUICK_CASH.filter((n) => n >= line.due - 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => patchRow(i, { amount: String(n) })}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
                    >
                      {formatKES(n)}
                    </button>
                  ))}
              </div>

              {!isCash && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-600">
                    {row.method === 'mpesa'
                      ? 'M-Pesa transaction code'
                      : 'Card / reference no.'}
                  </label>
                  <input
                    value={row.reference}
                    onChange={(e) =>
                      patchRow(i, { reference: e.target.value.toUpperCase() })
                    }
                    placeholder={row.method === 'mpesa' ? 'e.g. SFE4XY12ZK' : 'Approval code'}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                </div>
              )}

              {isCash && line.change > 0 && (
                <p className="mt-2 text-sm text-emerald-600">
                  Change from this payment:{' '}
                  <span className="font-semibold">{formatKES(line.change)}</span>
                </p>
              )}
              {overpaid && (
                <p className="mt-2 text-sm text-rose-600">
                  That is more than the {formatKES(line.due)} still owed.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {recon.outstanding > 0.001 && (
        <button
          onClick={addRow}
          className="mt-3 w-full rounded-xl border border-dashed border-teal-400 py-3 text-sm font-semibold text-teal-700 active:bg-teal-50"
        >
          + Add another payment for {formatKES(recon.outstanding)}
        </button>
      )}

      <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
        <div className="flex justify-between text-slate-500">
          <dt>Paid</dt>
          <dd>{formatKES(recon.paid)}</dd>
        </div>
        {recon.outstanding > 0.001 && (
          <div className="flex justify-between font-semibold text-rose-600">
            <dt>Still owed</dt>
            <dd>{formatKES(recon.outstanding)}</dd>
          </div>
        )}
        {recon.changeDue > 0 && (
          <div className="flex justify-between font-semibold text-emerald-600">
            <dt>Change due</dt>
            <dd>{formatKES(recon.changeDue)}</dd>
          </div>
        )}
      </dl>
    </Modal>
  )
}
