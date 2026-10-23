/**
 * تقاويم الاشتراك: ملف .ics لكل سهم وملف للسوق كاملًا، تُولَّد مع كل بناء من data.json
 * (إضافة calendarFeeds في vite.config.ts). يشترك المستخدم مرة واحدة فيُحدّث تطبيق التقويم
 * المواعيد تلقائيًا مع كل تحديث يومي للبيانات — بخلاف ملف .ics المُنزَّل الذي لا يتغيّر.
 * منطق نقي بلا اعتماد على المتصفح.
 */
import type { Stock } from './data'
import { buildIcs, dividendEvents } from './calendar'
import type { CalEvent } from './calendar'

export const FEED_DIR = 'calendar'
/** تبقى مواعيد آخر 12 شهرًا: لا تختفي من سجلّ المشترك فور انقضائها، ويبقى آخر توزيع سنوي ظاهرًا. */
const KEEP_DAYS = 365
const REFRESH_HOURS = 12

/** المسار النسبي لتقويم سهم، أو لتقويم السوق كاملًا عند غياب الرمز. */
export function feedPath(sym?: string): string {
  return `${FEED_DIR}/${sym ?? 'all'}.ics`
}

/** خريطة: المسار ← محتوى الملف. تقويم السهم بتنبيهات (اشتراك مقصود)، وتقويم السوق بلا تنبيهات. */
export function buildFeeds(stocks: Stock[], now: Date = new Date()): Map<string, string> {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS)
  const files = new Map<string, string>()
  const all: CalEvent[] = []
  for (const s of stocks) {
    const events = dividendEvents(s, from)
    all.push(...events)
    const name = s.name.split('—')[0]?.trim() || s.sym
    // يُنشأ التقويم حتى بلا مواعيد: من يشترك الآن تصله المواعيد حين تُعلن
    files.set(feedPath(s.sym), buildIcs(events, now, { name: `توزيعات ${s.sym} — ${name}`, refreshHours: REFRESH_HOURS }))
  }
  all.sort((a, b) => a.date.getTime() - b.date.getTime())
  files.set(feedPath(), buildIcs(all, now, { name: 'توزيعات الأسهم الإماراتية', alarms: false, refreshHours: REFRESH_HOURS }))
  return files
}
