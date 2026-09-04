import { getDB, STORES, newId } from './db'

/**
 * Persist a completed sale atomically:
 *  - write the sale record
 *  - queue it in pendingSync for later upload to a backend
 *  - decrement stock on each product sold
 * All in one IndexedDB transaction so an interrupted checkout cannot leave
 * a half-recorded sale.
 */
export async function recordSale(sale) {
  const db = await getDB()
  const record = { ...sale, id: sale.id || newId() }

  const tx = db.transaction(
    [STORES.SALES, STORES.PENDING_SYNC, STORES.PRODUCTS],
    'readwrite',
  )
  await tx.objectStore(STORES.SALES).put(record)
  await tx.objectStore(STORES.PENDING_SYNC).put({
    id: record.id,
    type: 'sale',
    payload: record,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  })

  const productStore = tx.objectStore(STORES.PRODUCTS)
  for (const item of record.items) {
    if (!item.productId) continue
    const product = await productStore.get(item.productId)
    if (product) {
      product.stock = Math.round((Number(product.stock) || 0) - item.quantity)
      product.updatedAt = new Date().toISOString()
      await productStore.put(product)
    }
  }

  await tx.done
  return record
}

export async function getAllSales() {
  const db = await getDB()
  const sales = await db.getAllFromIndex(STORES.SALES, 'createdAt')
  return sales.reverse() // newest first
}

export async function getPendingSync() {
  return (await getDB()).getAll(STORES.PENDING_SYNC)
}

export async function clearPendingSyncItem(id) {
  return (await getDB()).delete(STORES.PENDING_SYNC, id)
}

export async function nextReceiptNo() {
  const db = await getDB()
  const count = await db.count(STORES.SALES)
  const seq = String(count + 1).padStart(4, '0')
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `R${day}-${seq}`
}
