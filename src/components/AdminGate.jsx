import { useState } from 'react'
import { useApp } from '../context/AppContext'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']
const MAX = 8

/**
 * Full-screen PIN pad shown in place of an admin screen (Menu / Dashboard /
 * Settings) while the manager area is locked. The bar/sale screen never shows
 * this.
 */
export default function AdminGate({ label = 'the admin area' }) {
  const { unlockAdmin } = useApp()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function press(k) {
    setError(false)
    if (k === 'clear') return setPin('')
    if (k === 'back') return setPin((p) => p.slice(0, -1))
    setPin((p) => (p.length >= MAX ? p : p + k))
  }

  function submit() {
    if (unlockAdmin(pin)) return
    setError(true)
    setPin('')
  }

  return (
    <div className="mx-auto flex h-full max-w-xs flex-col items-center justify-center p-6">
      <div className="mb-2 text-4xl">🔒</div>
      <h2 className="text-lg font-semibold text-slate-800">Manager PIN</h2>
      <p className="mb-6 text-center text-sm text-slate-400">
        Enter the PIN to open {label}.
      </p>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < pin.length ? 'bg-teal-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mb-3 text-sm font-medium text-rose-500">
          Wrong PIN, try again.
        </p>
      )}

      <div className="grid w-full grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`h-16 rounded-xl text-xl font-semibold active:scale-95 ${
              k === 'clear' || k === 'back'
                ? 'bg-slate-100 text-sm text-slate-500'
                : 'bg-white text-slate-800 ring-1 ring-slate-200'
            }`}
          >
            {k === 'back' ? '⌫' : k === 'clear' ? 'Clear' : k}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={pin.length < 3}
        className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-bold text-white active:bg-teal-700 disabled:opacity-40"
      >
        Unlock
      </button>
    </div>
  )
}
