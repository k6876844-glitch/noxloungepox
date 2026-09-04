import { useApp } from '../context/AppContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OnlineIndicator() {
  const online = useOnlineStatus()
  const { pendingCount } = useApp()

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
      title={
        online
          ? 'Connected — sales can sync'
          : 'Offline — sales are saved on this device'
      }
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      {online ? 'Online' : 'Offline'}
      {pendingCount > 0 && (
        <span className="ml-1 rounded-full bg-white/70 px-1.5 text-[10px] text-slate-600">
          {pendingCount} to sync
        </span>
      )}
    </div>
  )
}
