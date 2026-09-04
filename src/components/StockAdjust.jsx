import { useState } from 'react'
import Modal from './Modal'

// Common restock amounts for a bar: single unit, six-pack, case of 12,
// crate of 24.
const STEPS = [1, 6, 12, 24]

export default function StockAdjust({ product, open, onClose, onSave }) {
  const [value, setValue] = useState(0)
  const [busy, setBusy] = useState(false)

  // Re-seed the input whenever a different item is opened.
  const [seedId, setSeedId] = useState(null)
  if (product && product.id !== seedId) {
    setSeedId(product.id)
    setValue(Number(product.stock) || 0)
  }

  if (!product) return null

  const current = Number(product.stock) || 0
  const delta = value - current
  const bump = (n) => setValue((v) => Math.max(0, Math.round((Number(v) || 0) + n)))

  async function save() {
    if (busy) return
    setBusy(true)
    try {
      await onSave(product.id, Math.max(0, Math.round(Number(value) || 0)))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      footer={
        <button
          onClick={save}
          disabled={busy || delta === 0}
          className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white active:bg-teal-700 disabled:opacity-40"
        >
          {busy
            ? 'Saving…'
            : delta === 0
              ? 'No change'
              : `Save — ${delta > 0 ? '+' : ''}${delta} (was ${current})`}
        </button>
      }
    >
      <p className="mb-1 font-medium text-slate-800">{product.name}</p>
      <p className="mb-4 text-xs text-slate-400">
        {product.category}
        {product.sku ? ` · ${product.sku}` : ''}
      </p>

      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          onClick={() => bump(-1)}
          className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-600 active:bg-slate-200"
          aria-label="Remove one"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="h-16 w-28 rounded-xl border border-slate-300 text-center text-3xl font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
        <button
          onClick={() => bump(1)}
          className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-600 active:bg-slate-200"
          aria-label="Add one"
        >
          +
        </button>
      </div>

      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        Received a delivery? Add:
      </p>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((n) => (
          <button
            key={n}
            onClick={() => bump(n)}
            className="rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 active:bg-slate-200"
          >
            +{n}
          </button>
        ))}
      </div>

      <button
        onClick={() => setValue(0)}
        className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-rose-500 active:bg-rose-50"
      >
        Set to 0 (sold out)
      </button>
    </Modal>
  )
}
