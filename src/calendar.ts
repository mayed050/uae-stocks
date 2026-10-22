/**
 * تصدير مواعيد التوزيعات إلى ملف تقويم iCalendar (RFC 5545) يُفتح في Google / Apple / Outlook.
 * منطق نقي بلا اعتماد على المتصفح — التنزيل الفعلي في export.ts.
 */
import type { Stock } from './data'
import { parseISO } from './lib'

export interface CalEvent {
  uid: string
  date: Date          // حدث يوم كامل
  title: string
  description: string
}

const STEPS: { key: 'lastEnt' | 'exd' | 'nextExd' | 'pay' | 'nextPay'; label: string }[] = [
  { key: 'lastEnt', label: 'آخر يوم شراء لاستحقاق التوزيع' },
  { key: 'exd', label: 'تاريخ الاستبعاد (التداول بدون أحقية)' },
  { key: 'nextExd', label: 'تاريخ استبعاد الشريحة القادمة' },
  { key: 'pay', label: 'تاريخ دفع التوزيع' },
  { key: 'nextPay', label: 'تاريخ دفع الشريحة القادمة' },
]

const ymd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

/** مواعيد التوزيع القادمة (اليوم فما بعد) لسهم واحد. */
export function dividendEvents(s: Stock, today: Date = new Date()): CalEvent[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const name = s.name.split('—')[0]?.trim() ?? s.sym
  const events: CalEvent[] = []
  for (const step of STEPS) {
    const d = parseISO(s.div[step.key] ?? null)
    if (!d || d < start) continue
    const details = [s.div.ps && `التوزيع: ${s.div.ps}`, `السوق: ${s.ex}`, 'تحقّق دائمًا من إفصاح الشركة الرسمي.']
    events.push({
      uid: `${s.sym}-${step.key}-${ymd(d)}@uae-stocks`,
      date: d,
      title: `${s.sym} · ${step.label}`,
      description: `${name}\n${details.filter(Boolean).join('\n')}`,
    })
  }
  return events
}

/** تهريب النص وفق RFC 5545 (الشرطة المائلة، الفاصلة، الفاصلة المنقوطة، الأسطر). */
export function escapeText(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** طيّ السطر عند 75 بايت (UTF-8) دون قطع حرف متعدد البايتات؛ أسطر الاستمرار تبدأ بمسافة. */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  const parts: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + n > limit) {
      parts.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

/** يبني ملف .ics كاملًا؛ لكل حدث تنبيه في الساعة 9 صباح اليوم السابق. */
export function buildIcs(events: CalEvent[], now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//uae-stocks//dividends//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  for (const e of events) {
    const next = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate() + 1)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT15H',
      `DESCRIPTION:${escapeText(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
