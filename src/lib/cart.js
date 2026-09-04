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
