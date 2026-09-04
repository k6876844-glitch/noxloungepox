import { useMemo, useState } from 'react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'
import { recordSale, nextReceiptNo } from '../db/sales'

const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'card', label: 'Card' },
]

const QUICK_CASH = [50, 100, 200, 500, 1000]

export default function Checkout({ open, onClose, onSuccess }) {
  const { cart, totals, clearCart, reloadProducts, reloadSales } = useApp()
  const [method, setMethod] = useState('cash')
  const [tendered, setTendered] = useState('')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)

  const total = totals.total
  const tenderedNum = Number(tendered) || 0
  const change = useMemo(
    () => Math.max(0, Math.round((tenderedNum - total + Number.EPSILON) * 100) / 100),
    [tenderedNum, total],
  )
  const cashShort = method === 'cash' && tenderedNum < total
  const needsRef = method !== 'cash'

  function reset() {
    setMethod('cash')
    setTendered('')
    setReference('')
    setBusy(false)
  }

  async function complete() {
    if (busy || cart.length === 0) return
    if (cashShort) return
    setBusy(true)
    try {
      const methodLabel = METHODS.find((m) => m.id === method)?.label || method
      const sale = {
        receiptNo: await nextReceiptNo(),
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          price: i.price,
          quantity: i.quantity,
        })),
        totals,
        payment: {
          method,
          methodLabel,
          amount: method === 'cash' ? tenderedNum || total : total,
          change: method === 'cash' ? change : 0,
          reference: needsRef ? reference.trim() : '',
        },
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
          disabled={busy || cashShort || cart.length === 0 || (needsRef && !reference.trim())}
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

      <div className="mb-4 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`rounded-xl py-3 text-sm font-semibold ${
              method === m.id
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'cash' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600">
            Cash received
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-right text-xl font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTendered(String(total))}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
            >
              Exact
            </button>
            {QUICK_CASH.filter((n) => n >= total - 1).map((n) => (
              <button
                key={n}
                onClick={() => setTendered(String(n))}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
              >
                {formatKES(n)}
              </button>
            ))}
          </div>
          <div
            className={`flex items-baseline justify-between rounded-xl px-4 py-3 ${
              cashShort ? 'bg-rose-50' : 'bg-emerald-50'
            }`}
          >
            <span className="text-sm text-slate-500">
              {cashShort ? 'Still owed' : 'Change'}
            </span>
            <span
              className={`text-xl font-bold ${
                cashShort ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatKES(cashShort ? total - tenderedNum : change)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            {method === 'mpesa' ? 'M-Pesa transaction code' : 'Card / reference no.'}
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder={method === 'mpesa' ? 'e.g. SFE4XY12ZK' : 'Approval code'}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
          <p className="text-xs text-slate-400">
            The customer pays {formatKES(total)} via {method === 'mpesa' ? 'M-Pesa' : 'card'}.
          </p>
        </div>
      )}
    </Modal>
  )
}
