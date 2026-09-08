export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function lineSubtotal(item) {
  return (Number(item.price) || 0) * (Number(item.quantity) || 0)
}

/**
 * Pure money math for the cart. Discount is applied to the subtotal, then VAT.
 *
 * @param items  [{ price, quantity }]
 * @param opts   { discount, discountType: 'amount'|'percent', taxRate, taxInclusive }
 */
export function calculateTotals(items, opts = {}) {
  const {
    discount = 0,
    discountType = 'amount',
    taxRate = 0,
    taxInclusive = false,
  } = opts

  const subtotal = items.reduce((sum, i) => sum + lineSubtotal(i), 0)

  let discountAmount =
    discountType === 'percent' ? (subtotal * (Number(discount) || 0)) / 100 : Number(discount) || 0
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal)

  const net = subtotal - discountAmount
  const rate = (Number(taxRate) || 0) / 100

  let tax
  let total
  if (taxInclusive) {
    tax = rate > 0 ? net - net / (1 + rate) : 0
    total = net
  } else {
    tax = net * rate
    total = net + tax
  }

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    net: round2(net),
    tax: round2(tax),
    total: round2(total),
    itemCount: items.reduce((n, i) => n + (Number(i.quantity) || 0), 0),
  }
}

/**
 * Reconcile one or more tender rows against the amount due. Lets a bill be
 * settled across methods, e.g. KES 3,000 cash then KES 600 M-Pesa, in any order.
 *
 * @param rows   [{ method: 'cash'|'mpesa'|'card', amount, reference? }]
 *               For cash, `amount` is the cash handed over (may exceed what is
 *               owed → change). For M-Pesa / card it is the amount charged.
 * @param total  the sale total
 * @returns { lines, paid, outstanding, changeDue, settled, overpaidNonCash }
 *          `lines[i].due` is the balance still owed *before* that row,
 *          `lines[i].amount` is how much of it that row actually covers.
 */
export function reconcileTenders(rows, total) {
  let outstanding = round2(total)
  let changeDue = 0
  let overpaidNonCash = false

  const lines = (rows || []).map((r) => {
    const due = round2(Math.max(0, outstanding))
    const entered = round2(Math.max(0, Number(r.amount) || 0))
    const applied = Math.min(entered, due)
    let change = 0
    if (r.method === 'cash') {
      change = round2(entered - applied)
    } else if (entered - due > 0.001) {
      overpaidNonCash = true
    }
    outstanding = round2(outstanding - applied)
    changeDue = round2(changeDue + change)
    return {
      method: r.method,
      reference: (r.reference || '').trim(),
      due,
      entered,
      amount: round2(applied),
      change,
    }
  })

  return {
    lines,
    paid: round2(total - Math.max(0, outstanding)),
    outstanding: round2(Math.max(0, outstanding)),
    changeDue,
    settled: outstanding <= 0.001,
    overpaidNonCash,
  }
}
