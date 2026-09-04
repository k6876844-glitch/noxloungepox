import { useState } from 'react'
import Modal from './Modal'

const BLANK = { name: '', price: '', sku: '', stock: '', category: '' }

export default function ProductForm({ open, initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial || BLANK)
  const [error, setError] = useState('')

  // Re-seed local state whenever a different product is opened.
  const [seedId, setSeedId] = useState(initial?.id ?? null)
  if ((initial?.id ?? null) !== seedId) {
    setSeedId(initial?.id ?? null)
    setForm(initial || BLANK)
    setError('')
  }

  const editing = Boolean(initial?.id)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required.')
    if (Number(form.price) < 0 || form.price === '') return setError('Enter a valid price.')
    try {
      await onSave({
        ...initial,
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save.')
    }
  }

  const field =
    'w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit item' : 'New item'}
      footer={
        <div className="flex gap-2">
          {editing && (
            <button
              onClick={() => {
                if (confirm(`Delete "${initial.name}"?`)) {
                  onDelete(initial.id)
                  onClose()
                }
              }}
              className="rounded-xl px-4 py-3 font-semibold text-rose-600 ring-1 ring-rose-200 active:bg-rose-50"
            >
              Delete
            </button>
          )}
          <button
            form="product-form"
            className="flex-1 rounded-xl bg-teal-600 py-3 font-semibold text-white active:bg-teal-700"
          >
            {editing ? 'Save changes' : 'Add item'}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-3">
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
          <input className={field} value={form.name} onChange={set('name')} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Price (KES)
            </label>
            <input
              className={field}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Stock qty
            </label>
            <input
              className={field}
              type="number"
              inputMode="numeric"
              value={form.stock}
              onChange={set('stock')}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Item code
            </label>
            <input className={field} value={form.sku} onChange={set('sku')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Category
            </label>
            <input
              className={field}
              value={form.category}
              onChange={set('category')}
              placeholder="General"
              list="pf-categories"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
