const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plainFormatter = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "KES 1,234.00" — for on-screen display. */
export function formatKES(amount) {
  return kesFormatter.format(Number(amount) || 0)
}

/** "1,234.00" — for the narrow monospace receipt. */
export function formatAmount(amount) {
  return plainFormatter.format(Number(amount) || 0)
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium' })
}

export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}
