import { useState } from 'react'
import Dashboard from './Dashboard'
import ProductsScreen from './ProductsScreen'

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'menu', label: 'Menu' },
]

/**
 * The manager area behind the Dashboard tab: an "Overview" of the day's
 * numbers and the full "Menu" editor (products + stock), switched with a
 * segmented control at the top.
 */
export default function AdminHub() {
  const [view, setView] = useState('overview')

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold ${
              view === v.id
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'overview' ? <Dashboard /> : <ProductsScreen />}
      </div>
    </div>
  )
}
