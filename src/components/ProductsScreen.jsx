import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'
import { saveProduct, deleteProduct, setProductStock } from '../db/products'
import ProductForm from './ProductForm'
import StockAdjust from './StockAdjust'

export default function ProductsScreen() {
  const { products, reloadProducts } = useApp()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // product | {} for new | null
  const [open, setOpen] = useState(false)
  const [stockFor, setStockFor] = useState(null) // product whose stock is being changed

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category || 'General'))].sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q),
    )
  }, [products, query])

  const lowStock = products.filter((p) => p.stock <= 5).length

  async function handleSave(data) {
    await saveProduct(data)
    await reloadProducts()
  }

  async function handleDelete(id) {
    await deleteProduct(id)
    await reloadProducts()
  }

  async function handleStock(id, stock) {
    await setProductStock(id, stock)
    await reloadProducts()
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-3 sm:p-4">
      <datalist id="pf-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="mb-3 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu…"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
        <button
          onClick={() => {
            setEditing({})
            setOpen(true)
          }}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white active:bg-teal-700"
        >
          + Add
        </button>
      </div>

      <p className="mb-2 px-1 text-xs text-slate-400">
        {products.length} items · tap a row to edit, tap the stock pill to restock
        {lowStock > 0 && (
          <span className="ml-2 font-semibold text-amber-600">
            · {lowStock} low on stock
          </span>
        )}
      </p>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
          >
            <button
              onClick={() => {
                setEditing(p)
                setOpen(true)
              }}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-800">
                  {p.name}
                </span>
                <span className="block text-xs text-slate-400">
                  {p.category}
                  {p.sku ? ` · ${p.sku}` : ''}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-teal-700">
                {formatKES(p.price)}
              </span>
            </button>

            <button
              onClick={() => setStockFor(p)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${
                p.stock <= 0
                  ? 'bg-rose-50 text-rose-600 ring-rose-200'
                  : p.stock <= 5
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-slate-50 text-slate-600 ring-slate-200'
              }`}
              aria-label={`Change stock for ${p.name}`}
            >
              {p.stock <= 0 ? 'Out' : `${p.stock} in stock`}
              <span className="ml-1 opacity-60">✎</span>
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No items found.</p>
        )}
      </div>

      <ProductForm
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <StockAdjust
        product={stockFor}
        open={!!stockFor}
        onClose={() => setStockFor(null)}
        onSave={handleStock}
      />
    </div>
  )
}
