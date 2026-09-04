import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'
import ProductList from './ProductList'
import Cart from './Cart'
import Checkout from './Checkout'
import Receipt from './Receipt'
import Modal from './Modal'

export default function SaleScreen() {
  const { cart, totals, addToCart, settings } = useApp()
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)

  function openCheckout() {
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  return (
    <div className="flex h-full flex-col lg:flex-row lg:gap-4">
      {/* Products */}
      <div className="min-h-0 flex-1 p-3 lg:p-4">
        <ProductList onPick={(p) => addToCart(p)} />
      </div>

      {/* Cart — persistent panel on large screens */}
      <aside className="hidden w-[22rem] shrink-0 border-l border-slate-200 bg-slate-50 p-4 lg:block">
        <Cart onCheckout={openCheckout} />
      </aside>

      {/* Mobile: sticky summary bar */}
      {cart.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-teal-600 px-4 py-3 text-white active:bg-teal-700"
          >
            <span className="font-semibold">
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
            </span>
            <span className="font-bold">{formatKES(totals.total)}</span>
            <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">
              View order
            </span>
          </button>
        </div>
      )}

      {/* Mobile: cart drawer */}
      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Order">
        <Cart onCheckout={openCheckout} />
      </Modal>

      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(sale) => {
          setCheckoutOpen(false)
          setCompletedSale(sale)
        }}
      />

      <Receipt
        sale={completedSale}
        settings={settings}
        open={!!completedSale}
        onClose={() => setCompletedSale(null)}
        onNewSale={() => setCompletedSale(null)}
      />
    </div>
  )
}
