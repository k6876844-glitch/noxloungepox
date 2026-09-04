import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getAllProducts } from '../db/products'
import { getAllSales, getPendingSync } from '../db/sales'
import {
  getSettings,
  saveSettings as persistSettings,
  DEFAULT_SETTINGS,
} from '../db/settings'
import { seedIfEmpty } from '../db/seed'
import { calculateTotals } from '../lib/cart'

const AppContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  // ---- admin lock (Menu / Dashboard / Settings) ----
  const [admin, setAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('nox-admin') === '1'
    } catch {
      return false
    }
  })

  // ---- cart state ----
  const [cart, setCart] = useState([]) // { productId, name, price, quantity, stock, sku }
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('amount') // 'amount' | 'percent'

  const reloadProducts = useCallback(async () => {
    setProducts(await getAllProducts())
  }, [])

  const reloadSales = useCallback(async () => {
    const [s, pending] = await Promise.all([getAllSales(), getPendingSync()])
    setSales(s)
    setPendingCount(pending.length)
  }, [])

  useEffect(() => {
    ;(async () => {
      await seedIfEmpty()
      const [p, s, cfg, pending] = await Promise.all([
        getAllProducts(),
        getAllSales(),
        getSettings(),
        getPendingSync(),
      ])
      setProducts(p)
      setSales(s)
      setSettings(cfg)
      setPendingCount(pending.length)
      setReady(true)
    })()
  }, [])

  const unlockAdmin = useCallback(
    (pin) => {
      const ok = String(pin) === String(settings.adminPin || '1234')
      if (ok) {
        setAdmin(true)
        try {
          sessionStorage.setItem('nox-admin', '1')
        } catch {
          /* ignore */
        }
      }
      return ok
    },
    [settings.adminPin],
  )

  const lockAdmin = useCallback(() => {
    setAdmin(false)
    try {
      sessionStorage.removeItem('nox-admin')
    } catch {
      /* ignore */
    }
  }, [])

  const updateSettings = useCallback(
    async (patch) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      await persistSettings(next)
    },
    [settings],
  )

  // ---- cart operations ----
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          sku: product.sku,
          stock: product.stock,
          quantity: qty,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
    )
  }, [])

  const setPrice = useCallback((productId, price) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, price: Math.max(0, Number(price) || 0) } : i,
      ),
    )
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(0)
    setDiscountType('amount')
  }, [])

  const totals = useMemo(
    () =>
      calculateTotals(cart, {
        discount,
        discountType,
        taxRate: settings.taxRate,
        taxInclusive: settings.taxInclusive,
      }),
    [cart, discount, discountType, settings.taxRate, settings.taxInclusive],
  )

  const value = {
    ready,
    products,
    reloadProducts,
    sales,
    reloadSales,
    pendingCount,
    settings,
    updateSettings,
    // admin lock
    admin,
    unlockAdmin,
    lockAdmin,
    // cart
    cart,
    addToCart,
    setQuantity,
    setPrice,
    removeFromCart,
    clearCart,
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    totals,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
