import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { resetToSampleMenu } from '../db/seed'

export default function SettingsScreen() {
  const { settings, updateSettings, reloadProducts, reloadSales } = useApp()
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)

  const set = (k) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    setSaved(false)
  }

  async function save(e) {
    e.preventDefault()
    await updateSettings({
      ...form,
      taxRate: Math.max(0, Number(form.taxRate) || 0),
    })
    setSaved(true)
  }

  async function handleReset() {
    if (
      !confirm(
        'Replace the whole menu and clear all sales with the sample club menu? This cannot be undone.',
      )
    )
      return
    setResetting(true)
    try {
      await resetToSampleMenu()
      await Promise.all([reloadProducts(), reloadSales()])
    } finally {
      setResetting(false)
    }
  }

  const field =
    'w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200'

  return (
    <div className="mx-auto max-w-lg space-y-6 overflow-y-auto p-3 sm:p-4">
      <form onSubmit={save} className="space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Club settings</h1>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Club name
          </label>
          <input className={field} value={form.storeName} onChange={set('storeName')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Address
          </label>
          <input className={field} value={form.address} onChange={set('address')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Phone</label>
          <input className={field} value={form.phone} onChange={set('phone')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              VAT rate (%)
            </label>
            <input
              className={field}
              type="number"
              min="0"
              step="0.5"
              value={form.taxRate}
              onChange={set('taxRate')}
            />
          </div>
          <label className="flex items-end gap-2 pb-3">
            <input
              type="checkbox"
              checked={form.taxInclusive}
              onChange={set('taxInclusive')}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm text-slate-600">Menu prices include VAT</span>
          </label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Receipt footer
          </label>
          <input
            className={field}
            value={form.receiptFooter}
            onChange={set('receiptFooter')}
          />
        </div>

        <button className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white active:bg-teal-700">
          {saved ? 'Saved ✓' : 'Save settings'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="font-semibold text-slate-800">Data</p>
        <p className="mt-1 text-xs text-slate-400">
          Everything is stored on this device (IndexedDB). Install the app from
          your browser menu to run it full-screen and fully offline.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 active:bg-rose-50 disabled:opacity-40"
        >
          {resetting ? 'Resetting…' : 'Reset to sample club menu'}
        </button>
      </div>
    </div>
  )
}
