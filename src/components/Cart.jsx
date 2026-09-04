import { useApp } from '../context/AppContext'
import { formatKES } from '../lib/format'
import { lineSubtotal } from '../lib/cart'

function Stepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(value - 1)}
        className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xl font-bold text-slate-600 active:bg-slate-200"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="h-9 w-12 rounded-lg border border-slate-200 text-center text-base"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xl font-bold text-slate-600 active:bg-slate-200"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

export default function Cart({ onCheckout }) {
  const {
    cart,
    setQuantity,
    removeFromCart,
    clearCart,
    totals,
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    settings,
  } = useApp()

  const empty = cart.length === 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="text-base font-semibold text-slate-700">
          Order{' '}
          {!empty && (
            <span className="text-slate-400">({totals.itemCount})</span>
          )}
        </h2>
        {!empty && (
          <button
            onClick={clearCart}
            className="text-xs font-medium text-rose-500 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {empty && (
          <p className="py-16 text-center text-sm text-slate-400">
            Tap a drink to start an order.
          </p>
        )}
        {cart.map((item) => (
          <div
            key={item.productId}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatKES(item.price)} each
                  {item.quantity > item.stock && (
                    <span className="ml-1 font-semibold text-amber-600">
                      · only {item.stock} in stock
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-xs text-slate-400 hover:text-rose-500"
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Stepper
                value={item.quantity}
                onChange={(q) => setQuantity(item.productId, q)}
              />
              <span className="font-semibold text-slate-800">
                {formatKES(lineSubtotal(item))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!empty && (
        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Discount</label>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-right"
            />
            <div className="flex overflow-hidden rounded-lg ring-1 ring-slate-200">
              {['amount', 'percent'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className={`px-3 py-1.5 text-sm ${
                    discountType === t
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-500'
                  }`}
                >
                  {t === 'amount' ? 'KES' : '%'}
                </button>
              ))}
            </div>
          </div>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd>{formatKES(totals.subtotal)}</dd>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-rose-500">
                <dt>Discount</dt>
                <dd>−{formatKES(totals.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <dt>
                VAT ({settings.taxRate}%
                {settings.taxInclusive ? ', incl.' : ''})
              </dt>
              <dd>{formatKES(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatKES(totals.total)}</dd>
            </div>
          </dl>

          <button
            onClick={onCheckout}
            className="w-full rounded-xl bg-teal-600 py-4 text-lg font-bold text-white shadow-sm active:bg-teal-700"
          >
            Checkout · {formatKES(totals.total)}
          </button>
        </div>
      )}
    </div>
  )
}
