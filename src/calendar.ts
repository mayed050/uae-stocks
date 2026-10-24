/**
 * تصدير مواعيد التوزيعات إلى ملف تقويم iCalendar (RFC 5545) يُفتح في Google / Apple / Outlook.
 * منطق نقي بلا اعتماد على المتصفح — التنزيل الفعلي في export.ts.
 */
import type { Stock } from './data'
import { parseISO } from './lib'

export type EventStep = 'lastEnt' | 'exd' | 'nextExd' | 'pay' | 'nextPay'

export interface CalEvent {
  uid: string
  date: Date          // حدث يوم كامل
  title: string
  description: string
  // حقول منظَّمة لعرض المواعيد في الواجهة (أجندة النظرة العامة)
  sym?: string
  step?: EventStep
  ps?: string | null
  auto?: boolean      // التاريخ آلي من TradingView ولم يُتحقق منه بعد
}

const STEPS: { key: EventStep; label: string }[] = [
  { key: 'lastEnt', label: 'آخر يوم شراء لاستحقاق التوزيع' },
  { key: 'exd', label: 'تاريخ الاستبعاد (التداول بدون أحقية)' },
  { key: 'nextExd', label: 'تاريخ استبعاد الشريحة القادمة' },
  { key: 'pay', label: 'تاريخ دفع التوزيع' },
  { key: 'nextPay', label: 'تاريخ دفع الشريحة القادمة' },
]

const ymd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

/** مصدر التاريخ في وصف الحدث: إفصاح رسمي مُراجَع، أو قيمة آلية لم يُتحقق منها بعد. */
function provenance(s: Stock, key: (typeof STEPS)[number]['key']): string {
  if (s.div.auto?.fields.includes(key)) return 'المصدر: TradingView (آلي — يلزم التحقق من إفصاح الشركة).'
  if (s.div.src && !key.startsWith('next')) return `الإفصاح الرسمي: ${s.div.src.url}`
  return 'تحقّق دائمًا من إفصاح الشركة الرسمي.'
}

/** مواعيد التوزيع لسهم واحد بدءًا من تاريخ from (افتراضيًا اليوم: القادمة فقط). */
export function dividendEvents(s: Stock, from: Date = new Date()): CalEvent[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const name = s.name.split('—')[0]?.trim() ?? s.sym
  const events: CalEvent[] = []
  for (const step of STEPS) {
    const d = parseISO(s.div[step.key] ?? null)
    if (!d || d < start) continue
    const ps = step.key.startsWith('next') ? (s.div.nextPs ?? s.div.ps) : s.div.ps
    const details = [ps && `التوزيع: ${ps}`, `السوق: ${s.ex}`, provenance(s, step.key)]
    events.push({
      uid: `${s.sym}-${step.key}-${ymd(d)}@uae-stocks`,
      date: d,
      title: `${s.sym} · ${step.label}`,
      description: `${name}\n${details.filter(Boolean).join('\n')}`,
      sym: s.sym,
      step: step.key,
      ps,
      auto: s.div.auto?.fields.includes(step.key) ?? false,
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

export interface IcsOptions {
  /** اسم التقويم في تطبيق المستخدم (تقاويم الاشتراك). */
  name?: string
  /** تنبيه 9 صباح اليوم السابق لكل حدث (افتراضيًا نعم؛ يُعطَّل في تقويم السوق كاملًا كي لا يغرق المستخدم بالتنبيهات). */
  alarms?: boolean
  /** تقويم اشتراك: يطلب من التطبيق إعادة الجلب كل refreshHours ساعة. */
  refreshHours?: number
}

/** يبني ملف .ics كاملًا؛ لكل حدث تنبيه في الساعة 9 صباح اليوم السابق ما لم يُعطَّل. */
export function buildIcs(events: CalEvent[], now: Date = new Date(), opts: IcsOptions = {}): string {
  const { name, alarms = true, refreshHours } = opts
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//uae-stocks//dividends//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  if (name) lines.push(`X-WR-CALNAME:${escapeText(name)}`, 'X-WR-TIMEZONE:Asia/Dubai')
  if (refreshHours) lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${refreshHours}H`, `X-PUBLISHED-TTL:PT${refreshHours}H`)
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
    )
    if (alarms) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT15H', `DESCRIPTION:${escapeText(e.title)}`, 'END:VALARM')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
