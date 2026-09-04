import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { syncPendingSales } from './lib/sync'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import OnlineIndicator from './components/OnlineIndicator'
import SaleScreen from './components/SaleScreen'
import SalesHistory from './components/SalesHistory'
import AdminHub from './components/AdminHub'
import SettingsScreen from './components/SettingsScreen'
import AdminGate from './components/AdminGate'

const TABS = [
  { id: 'sale', label: 'Bar', icon: '🍸' },
  { id: 'history', label: 'History', icon: '🧾' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', admin: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', admin: true },
]

export default function App() {
  const { ready, settings, reloadSales, admin, lockAdmin } = useApp()
  const [tab, setTab] = useState('sale')
  const online = useOnlineStatus()

  // Opportunistically flush the sync queue when connectivity returns.
  useEffect(() => {
    if (!online) return
    syncPendingSales().then((res) => {
      if (res.synced > 0) reloadSales()
    })
  }, [online, reloadSales])

  if (!ready) {
    return (
      <div className="grid h-full place-items-center text-slate-400">Loading…</div>
    )
  }

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0]
  const locked = activeTab.admin && !admin

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
            🍸
          </span>
          <span className="font-bold text-slate-800">{settings.storeName}</span>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <button
              onClick={() => {
                lockAdmin()
                setTab('sale')
              }}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 active:bg-slate-200"
            >
              🔓 Lock admin
            </button>
          )}
          <OnlineIndicator />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {locked ? (
          <AdminGate label={activeTab.label} />
        ) : (
          <>
            {tab === 'sale' && <SaleScreen />}
            {tab === 'history' && <SalesHistory />}
            {tab === 'dashboard' && <AdminHub />}
            {tab === 'settings' && <SettingsScreen />}
          </>
        )}
      </main>

      <nav className="grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              tab === t.id ? 'text-teal-600' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
            {t.admin && !admin && (
              <span className="absolute right-2 top-1 text-[10px]" aria-hidden>
                🔒
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
