/** تنزيل محتوى نصي كملف عبر رابط مؤقت. */
export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * تصدير صفوف إلى ملف CSV يفتح مباشرةً في Excel.
 * يضيف BOM (U+FEFF) لضمان ظهور العربية بشكل صحيح.
 */
export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  downloadFile(filename.endsWith('.csv') ? filename : `${filename}.csv`, '﻿' + csv, 'text/csv;charset=utf-8;')
}

/** تنزيل ملف تقويم .ics (يُضاف بفتحه إلى Google / Apple / Outlook). */
export function exportIcs(filename: string, ics: string) {
  downloadFile(filename.endsWith('.ics') ? filename : `${filename}.ics`, ics, 'text/calendar;charset=utf-8')
}
