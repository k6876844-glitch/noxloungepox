import { getDB, STORES } from './db'

export const DEFAULT_SETTINGS = {
  storeName: 'Nox Lounge',
  address: 'Kilimani, Nairobi',
  phone: '+254 700 000 000',
  taxRate: 16, // VAT %, applied at checkout
  taxInclusive: true, // bar prices on the menu already include VAT
  currency: 'KES',
  receiptFooter: 'Drink responsibly. Karibu tena!',
  // Manager PIN that unlocks the admin area (Menu, Dashboard, Settings).
  // The bar/sale screen never needs it. Change it in Settings.
  adminPin: '1234',
}

// Previous default club names — treated as "not set by the user" so the
// current default wins until the owner picks their own in Settings.
const STALE_DEFAULT_NAMES = new Set(['Duka Yangu', 'Skyline Lounge'])

export async function getSettings() {
  const db = await getDB()
  const rows = await db.getAll(STORES.SETTINGS)
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  if (STALE_DEFAULT_NAMES.has(stored.storeName)) delete stored.storeName
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(settings) {
  const db = await getDB()
  const tx = db.transaction(STORES.SETTINGS, 'readwrite')
  for (const [key, value] of Object.entries(settings)) {
    await tx.store.put({ key, value })
  }
  await tx.done
}
