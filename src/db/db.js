import { openDB } from 'idb'

const DB_NAME = 'duka-pos'
const DB_VERSION = 1

export const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PENDING_SYNC: 'pendingSync',
  SETTINGS: 'settings',
}

let dbPromise

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const products = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
          products.createIndex('name', 'name')
          products.createIndex('sku', 'sku')
          products.createIndex('category', 'category')
        }
        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const sales = db.createObjectStore(STORES.SALES, { keyPath: 'id' })
          sales.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
