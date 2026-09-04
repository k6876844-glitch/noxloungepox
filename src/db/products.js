import { getDB, STORES, newId } from './db'

export async function getAllProducts() {
  const db = await getDB()
  const all = await db.getAll(STORES.PRODUCTS)
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProduct(id) {
  return (await getDB()).get(STORES.PRODUCTS, id)
}

export function normalizeProduct(input) {
  const now = new Date().toISOString()
  return {
    id: input.id || newId(),
    name: (input.name || '').trim(),
    price: Math.max(0, Number(input.price) || 0),
    sku: (input.sku || '').trim(),
    stock: Math.round(Number(input.stock) || 0),
    category: (input.category || 'General').trim() || 'General',
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
}

export async function saveProduct(input) {
  const record = normalizeProduct(input)
  if (!record.name) throw new Error('Product name is required')
  await (await getDB()).put(STORES.PRODUCTS, record)
  return record
}

export async function deleteProduct(id) {
  return (await getDB()).delete(STORES.PRODUCTS, id)
}

/**
 * Set an item's stock to an exact count (e.g. after a stock-take or a
 * delivery). Returns the updated record.
 */
export async function setProductStock(id, stock) {
  const db = await getDB()
  const tx = db.transaction(STORES.PRODUCTS, 'readwrite')
  const product = await tx.store.get(id)
  if (!product) throw new Error('Item not found')
  product.stock = Math.max(0, Math.round(Number(stock) || 0))
  product.updatedAt = new Date().toISOString()
  await tx.store.put(product)
  await tx.done
  return product
}

export async function bulkPutProducts(products) {
  const db = await getDB()
  const tx = db.transaction(STORES.PRODUCTS, 'readwrite')
  await Promise.all(products.map((p) => tx.store.put(p)))
  await tx.done
}
