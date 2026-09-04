import { createPortal } from 'react-dom'
import Modal from './Modal'
import { receiptToText } from '../lib/receipt'

/**
 * Shows the receipt for a just-completed sale. The on-screen block is a
 * preview; the copy rendered into #receipt-print-area (portal) is what the
 * browser print dialog sends to the printer — see index.css @media print.
 */
export default function Receipt({ sale, settings, open, onClose, onNewSale }) {
  if (!sale) return null

  const text = receiptToText(sale, settings)
  const printTarget = document.getElementById('receipt-print-area')

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Sale complete"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-white active:bg-slate-900"
            >
              Print receipt
            </button>
            <button
              onClick={onNewSale}
              className="flex-1 rounded-xl bg-teal-600 py-3 font-semibold text-white active:bg-teal-700"
            >
              New sale
            </button>
          </div>
        }
      >
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved offline as <span className="font-semibold">{sale.receiptNo}</span>. It
          will sync when a backend is connected.
        </div>
        <pre className="mx-auto w-[280px] overflow-x-auto whitespace-pre rounded-lg border border-dashed border-slate-300 bg-white p-3 font-mono text-[11px] leading-snug text-slate-800">
          {text}
        </pre>
      </Modal>

      {open && printTarget
        ? createPortal(<pre className="receipt-paper">{text}</pre>, printTarget)
        : null}
    </>
  )
}
