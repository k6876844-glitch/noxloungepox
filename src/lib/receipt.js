import { formatAmount, formatDateTime } from './format'

// Characters per line for a 58mm thermal roll (Font A, ~32 cols).
export const RECEIPT_WIDTH = 32

function padLine(left, right, width = RECEIPT_WIDTH) {
  const l = String(left)
  const r = String(right)
  const gap = Math.max(1, width - l.length - r.length)
  return l + ' '.repeat(gap) + r
}

function center(text, width = RECEIPT_WIDTH) {
  const t = String(text)
  if (t.length >= width) return t
  const pad = Math.floor((width - t.length) / 2)
  return ' '.repeat(pad) + t
}

function divider(ch = '-') {
  return ch.repeat(RECEIPT_WIDTH)
}

/**
 * Render a sale to the plain-text receipt body. This is the single source of
 * truth for receipt layout — both the on-screen preview and the (future)
 * thermal printer use it.
 */
export function receiptToText(sale, settings) {
  const lines = []

  lines.push(center(settings.storeName.toUpperCase()))
  if (settings.address) lines.push(center(settings.address))
  if (settings.phone) lines.push(center(settings.phone))
  lines.push('')
  lines.push(padLine('Receipt:', sale.receiptNo))
  lines.push(padLine('Date:', formatDateTime(sale.createdAt)))
  if (sale.cashier) lines.push(padLine('Served by:', sale.cashier))
  lines.push(divider())

  for (const item of sale.items) {
    lines.push(item.name)
    lines.push(
      padLine(
        `  ${item.quantity} x ${formatAmount(item.price)}`,
        formatAmount(item.quantity * item.price),
      ),
    )
  }

  lines.push(divider())
  lines.push(padLine('Subtotal', formatAmount(sale.totals.subtotal)))
  if (sale.totals.discountAmount > 0) {
    lines.push(padLine('Discount', '-' + formatAmount(sale.totals.discountAmount)))
  }
  lines.push(
    padLine(
      `VAT ${settings.taxRate}%${settings.taxInclusive ? ' (incl)' : ''}`,
      formatAmount(sale.totals.tax),
    ),
  )
  lines.push(padLine('TOTAL KES', formatAmount(sale.totals.total)))
  lines.push(divider())

  lines.push(padLine(`Paid — ${sale.payment.methodLabel}`, formatAmount(sale.payment.amount)))
  if (sale.payment.method === 'cash') {
    lines.push(padLine('Change', formatAmount(sale.payment.change)))
  }
  if (sale.payment.reference) {
    lines.push(padLine('Ref', sale.payment.reference))
  }
  lines.push(divider())
  if (settings.receiptFooter) {
    for (const part of wrap(settings.receiptFooter, RECEIPT_WIDTH)) lines.push(center(part))
  }
  lines.push('')

  return lines.join('\n')
}

function wrap(text, width) {
  const words = String(text).split(/\s+/)
  const out = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      if (line) out.push(line)
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) out.push(line)
  return out
}

/**
 * STUB — future 58mm thermal support.
 *
 * Returns an ESC/POS byte stream for the sale. Nothing calls this yet; the app
 * prints through the browser dialog (window.print) today. To enable a real
 * thermal printer later, send these bytes over Web Serial / WebUSB or to a
 * local print-bridge, e.g.:
 *
 *   const port = await navigator.serial.requestPort()
 *   await port.open({ baudRate: 9600 })
 *   const writer = port.writable.getWriter()
 *   await writer.write(receiptToEscPos(sale, settings))
 */
export function receiptToEscPos(sale, settings) {
  const ESC = 0x1b
  const GS = 0x1d
  const enc = new TextEncoder()
  const out = []
  const write = (arr) => out.push(...arr)

  write([ESC, 0x40]) // initialize printer
  write([ESC, 0x61, 0x00]) // align left
  write([...enc.encode(receiptToText(sale, settings))])
  write([0x0a, 0x0a, 0x0a]) // feed
  write([GS, 0x56, 0x00]) // full cut

  return new Uint8Array(out)
}
