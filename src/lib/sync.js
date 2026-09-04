import { getPendingSync, clearPendingSyncItem } from '../db/sales'

// Point this at a real endpoint (e.g. in a .env file: VITE_SYNC_URL=...) to
// turn on live syncing. Until then the function below runs in stub mode.
const SYNC_ENDPOINT = import.meta.env.VITE_SYNC_URL || ''

/**
 * Push queued sales to the backend. STUBBED: with no VITE_SYNC_URL configured
 * this reports what *would* be synced and leaves the queue intact, so no data
 * is ever lost. Wire up the fetch branch when a backend exists.
 */
export async function syncPendingSales() {
  const pending = await getPendingSync()

  if (pending.length === 0) {
    return { ok: true, synced: 0, remaining: 0, stub: !SYNC_ENDPOINT }
  }

  if (!SYNC_ENDPOINT) {
    console.info(
      `[sync] stub mode — ${pending.length} sale(s) queued locally. ` +
        'Set VITE_SYNC_URL to enable upload.',
    )
    return { ok: true, synced: 0, remaining: pending.length, stub: true }
  }

  if (!navigator.onLine) {
    return { ok: false, synced: 0, remaining: pending.length, offline: true }
  }

  let synced = 0
  for (const item of pending) {
    try {
      const res = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await clearPendingSyncItem(item.id)
      synced += 1
    } catch (err) {
      console.warn('[sync] upload failed, will retry later:', err)
      break // stop on first failure; keep the rest queued
    }
  }

  const remaining = (await getPendingSync()).length
  return { ok: remaining === 0, synced, remaining, stub: false }
}
