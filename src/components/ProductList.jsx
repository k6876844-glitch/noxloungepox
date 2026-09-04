import { useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'

/**
 * Touch-friendly product grid for the sale screen. Tapping a card adds it to
 * the cart. The search box matches name or SKU; a barcode scanner (which types
 * the code then presses Enter) will add an exact SKU match straight away.
 */
export default function ProductList({ onPick }) {
  const { products } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const inputRef = useRef(null)

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || 'General'))
    return ['All', ...[...set].sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'All' && (p.category || 'General') !== category) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      )
    })
  }, [products, query, category])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    if (!q) return
    const exact = products.find((p) => (p.sku || '').toLowerCase() === q)
    const pick = exact || (filtered.length === 1 ? filtered[0] : null)
    if (pick) {
      onPick(pick)
      setQuery('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleSubmit} className="mb-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu or scan…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          autoComplete="off"
          inputMode="search"
        />
      </form>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              category === c
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => {
          const out = p.stock <= 0
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className={`flex min-h-24 flex-col justify-between rounded-xl border p-3 text-left transition active:scale-[0.98] ${
                out
                  ? 'border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white hover:border-teal-400 hover:shadow-sm'
              }`}
            >
              <span className="line-clamp-2 text-sm font-medium leading-tight">
                {p.name}
              </span>
              <span className="mt-2 flex items-center justify-between">
                <span className="font-semibold text-teal-700">
                  {formatKES(p.price)}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    out
                      ? 'bg-rose-100 text-rose-600'
                      : p.stock <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {out ? 'Out' : p.stock > 500 ? 'In stock' : `${p.stock} left`}
                </span>
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-400">
            Nothing on the menu matches “{query}”.
          </p>
        )}
      </div>
    </div>
  )
}
