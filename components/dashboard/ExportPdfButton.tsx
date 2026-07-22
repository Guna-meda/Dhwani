'use client'

import { Download } from 'lucide-react'

// Triggers the browser's native print dialog with "Save as PDF" as a
// destination — not a separate PDF-rendering pipeline. This means the
// export always looks exactly like what's on screen (via the print-content/
// no-print classes in globals.css), with zero extra backend infra and zero
// risk of a second report-layout implementation drifting from the real one.
export default function ExportPdfButton({ label = 'Export PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text bg-brand-card border border-brand-border hover:bg-brand-surface transition-colors rounded-lg px-3 py-2"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
