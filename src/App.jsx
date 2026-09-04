import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { syncPendingSales } from './lib/sync'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import OnlineIndicator from './components/OnlineIndicator'
import SaleScreen from './components/SaleScreen'
import SalesHistory from './components/SalesHistory'
import AdminHub from './components/AdminHub'
import SettingsScreen from './components/SettingsScreen'
import AuthGate from './components/AuthGate'

const TABS = [
  { id: 'sale', label: 'Bar', icon: '🍸' },
  { id: 'history', label: 'History', icon: '🧾' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', admin: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', admin: true },
]

export default function App() {
  const { ready, settings, reloadSales, currentUser, logout } = useApp()
  const [tab, setTab] = useState('sale')
  const online = useOnlineStatus()
  const isAdmin = currentUser?.role === 'admin'
  const visibleTabs = TABS.filter((t) => !t.admin || isAdmin)

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

  if (!currentUser) {
    return <AuthGate />
  }

  const activeTab = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0]

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
          <span className="text-xs font-medium text-slate-500">
            {currentUser.username}
            {isAdmin && ' · admin'}
          </span>
          <button
            onClick={() => {
              logout()
              setTab('sale')
            }}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 active:bg-slate-200"
          >
            Log out
          </button>
          <OnlineIndicator />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {activeTab.id === 'sale' && <SaleScreen />}
        {activeTab.id === 'history' && <SalesHistory />}
        {activeTab.id === 'dashboard' && <AdminHub />}
        {activeTab.id === 'settings' && <SettingsScreen />}
      </main>

      <nav
        className={`grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] ${
          isAdmin ? 'grid-cols-4' : 'grid-cols-2'
        }`}
      >
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              tab === t.id ? 'text-teal-600' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
