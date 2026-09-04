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
import { registerUser, verifyLogin } from '../db/users'
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

  // ---- signed-in user (Menu / Dashboard / Settings are admin-only) ----
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('nox-user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
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

  function persistSession(user) {
    const session = { id: user.id, username: user.username, role: user.role }
    setCurrentUser(session)
    try {
      sessionStorage.setItem('nox-user', JSON.stringify(session))
    } catch {
      /* ignore */
    }
    return session
  }

  const login = useCallback(async (username, password) => {
    const user = await verifyLogin(username, password)
    if (!user) return false
    persistSession(user)
    return true
  }, [])

  const register = useCallback(async ({ username, password, role }) => {
    const user = await registerUser({ username, password, role })
    return persistSession(user)
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    try {
      sessionStorage.removeItem('nox-user')
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
    // auth
    currentUser,
    login,
    register,
    logout,
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
