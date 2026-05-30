import type { Stock } from './data'

const USD_AED = 3.6725

/** يستخرج قيمة رقمية بالدرهم من نص مثل "130.5 مليار" أو "5.2 مليار $ (~19.1 مليار درهم)". */
export function parseAmount(s: string | null | undefined): number | null {
  if (!s) return null
  const str = String(s)
  const direct = str.match(/([\d.,]+)\s*(مليار|مليون|ألف)\s*درهم/)
  const m = direct || str.match(/([\d.,]+)\s*(مليار|مليون|ألف)/) || str.match(/([\d.,]+)/)
  if (!m) return null
  let num = parseFloat(m[1].replace(/,/g, ''))
  if (isNaN(num)) return null
  const unit = m[2]
  if (unit === 'مليار') num *= 1e9
  else if (unit === 'مليون') num *= 1e6
  else if (unit === 'ألف') num *= 1e3
  // تطبيع الدولار إلى الدرهم إذا لم تُذكر قيمة بالدرهم صراحة
  if (!direct && /\$/.test(str)) num *= USD_AED
  return num
}

/** نسبة النمو من نص مثل "9.09 مليار (+25.6%)". يأخذ أول رقم داخل القوس. */
export function parseGrowth(s: string | null | undefined): number | null {
  if (!s) return null
  const m = String(s).match(/\(\s*([+−-]?)\s*(\d+(?:\.\d+)?)\s*[–-]?/)
  if (!m) return null
  const sign = m[1] === '-' || m[1] === '−' ? -1 : 1
  return parseFloat(m[2]) * sign
}

/** العائد النقدي كرقم من نص مثل "~4.7% سنوي" أو "~7–8%". */
export function parseYield(s: string | null | undefined): number | null {
  if (!s) return null
  const m = String(s).match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

/** صيغة مختصرة للأرقام الكبيرة بالدرهم. */
export function fmtAmount(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' تريليون'
  if (n >= 1e9) return (n / 1e9).toFixed(n / 1e9 >= 100 ? 0 : 1) + ' مليار'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' مليون'
  return n.toLocaleString('en-US')
}

export interface Scores {
  yield: number
  value: number
  growth: number
  stability: number
  size: number
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/** ملف وصفي محايد للسهم على 5 محاور (0–100). ليس تقييمًا استثماريًا. */
export function scores(s: Stock): Scores {
  const y = parseYield(s.div.yld)
  const g = parseGrowth(s.net)
  const mc = parseAmount(s.mcap)
  return {
    yield: y === null ? 0 : clamp((y / 8) * 100),
    value: s.pe === null ? 50 : clamp(((40 - s.pe) / 35) * 100),
    growth: g === null ? 45 : clamp((g / 35) * 100),
    stability: s.cat === 'income' ? 85 : s.cat === 'growth' ? 60 : 32,
    size: mc === null ? 40 : clamp((mc / 130e9) * 100),
  }
}

export const AXIS_LABEL: Record<keyof Scores, string> = {
  yield: 'العائد',
  value: 'التقييم',
  growth: 'النمو',
  stability: 'الاستقرار',
  size: 'الحجم',
}

/** لون ثابت مشتق من الرمز (للأفاتار). */
export function symColor(sym: string): string {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 360
  return `hsl(${h} 65% 45%)`
}

/** اسم الشهر العربي من رقم 0–11. */
export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

/** يستخرج التوزيع النقدي للسهم كقيمة رقمية بالدرهم. */
export function parseDivPs(s: string | null | undefined): number | null {
  if (!s) return null
  const clean = s.replace(/~/g, '').trim()
  const m = clean.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const val = parseFloat(m[1])
  if (clean.includes('فلس')) {
    return val / 100
  }
  return val
}

/** يحسب التوزيع السنوي الإجمالي للسهم بناءً على التكرار الرسمي (freq). */
export function getAnnualPs(s: Stock): number {
  const val = parseDivPs(s.div.ps) ?? 0
  const freq = s.div.freq ?? ''
  // الأولوية لحقل freq الرسمي — لا نعتمد على نص ps لتحديد التكرار
  if (freq === 'ربعي') return val * 4
  if (freq === 'نصف سنوي') return val * 2
  if (freq === 'سنوي') return val
  // fallback: بعض السجلات القديمة قد تضمّن التكرار في ps
  if (s.div.ps?.includes('ربع')) return val * 4
  return val
}
