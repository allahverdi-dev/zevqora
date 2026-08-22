/**
 * Client-side file export.
 *
 * Genuinely writes a local file via a Blob URL — no server involved. Used by
 * Incidents (timeline export) and Analytics (CSV/JSON export), both of which
 * the product brief calls out as needing to actually work rather than being
 * inert buttons.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function downloadJson(filename: string, data: unknown): void {
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    filename,
  )
}

/** Encodes a 2D array of cells as RFC 4180-ish CSV. */
export function downloadCsv(filename: string, rows: readonly (readonly unknown[])[]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(','),
    )
    .join('\n')

  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}
